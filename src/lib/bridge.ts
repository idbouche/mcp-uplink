import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, CallToolResult, ListToolsResult } from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosError } from "axios";
import { Config, captureEnvironment } from "./config.js";

export class McpBridge {
    private server: Server;
    private config: Config;
    private capturedEnv: Record<string, string>;

    constructor(config: Config) {
        this.config = config;
        this.capturedEnv = captureEnvironment(config);

        // Initialiser le serveur local (interface pour Claude/Cursor)
        this.server = new Server(
            {
                name: "mcp-uplink",
                version: "0.1.0",
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupHandlers();
    }

    private setupHandlers() {
        // Handler: List Tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            try {
                const response = await this.forwardRequest<ListToolsResult>("tools/list", {});
                return response;
            } catch (error) {
                this.logError("ListTools Error", error);
                throw error;
            }
        });

        // Handler: Call Tool
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                // For tools/call, pass the tool name and arguments
                const response = await this.forwardRequest<CallToolResult>("tools/call", {
                    name: request.params.name,
                    arguments: request.params.arguments
                });
                return response;
            } catch (error) {
                this.logError(`CallTool Error (${request.params.name})`, error);
                throw error;
            }
        });
    }

    /**
     * Transfère la requête vers la plateforme distante via HTTP
     */
    private async forwardRequest<T>(method: string, params: unknown): Promise<T> {
        const url = `${this.config.mcpUrl}`; // L'URL de base, ex: http://localhost:3000/api/mcp/slack

        // Préparer les headers spéciaux
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-Mcp-ApiKey": this.config.apiKey,
            "X-Mcp-Env": Buffer.from(JSON.stringify(this.capturedEnv)).toString('base64'),
        };

        if (this.config.enabledTools) {
            headers["X-Mcp-Enabled-Tools"] = this.config.enabledTools;
        }

        // Payload JSON-RPC standard
        const payload = {
            jsonrpc: "2.0",
            id: Math.floor(Math.random() * 1000000),
            method: method,
            params: params
        };

        try {
            // Note: On suppose que l'endpoint distant accepte du JSON-RPC ou REST compatible
            // Si l'endpoint est purement SSE, il faudrait une autre approche.
            // Ici on vise l'endpoint /api/mcp/execute que nous avons déjà testé

            // Adaptation pour notre endpoint /api/mcp/execute existant
            // Notre endpoint attend: { mcpSlug, method, params, clientEnv }
            // Mais le bridge est générique. 
            // Si on tape sur /api/mcp/slack, c'est un endpoint spécifique.

            // Pour être compatible avec notre plateforme actuelle, on doit envoyer
            // les données comme le serveur les attend.

            const response = await axios.post(url, payload, { headers });

            if (response.data.error) {
                throw new Error(response.data.error.message || "Unknown remote error");
            }

            return response.data.result;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError<{ error?: { message?: string } }>;
                const msg = axiosError.response?.data?.error?.message || axiosError.message;
                throw new Error(`Remote MCP Error: ${msg}`);
            }
            throw error;
        }
    }

    private logError(context: string, error: unknown) {
        // On log sur stderr pour ne pas casser le flux JSON-RPC sur stdout
        console.error(`[MCP-UPLINK] ${context}:`, error instanceof Error ? error.message : error);
    }

    public async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error(`[MCP-UPLINK] Connected to Stdio. Forwarding to ${this.config.mcpUrl}`);
    }
}

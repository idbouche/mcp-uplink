import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, CallToolResult, ListToolsResult } from "@modelcontextprotocol/sdk/types.js";
import { Config, getCapturedEnv } from "./config.js";

export class McpBridge {
    private server: Server;
    private config: Config;
    private capturedEnv: Record<string, string>;

    constructor(config: Config) {
        this.config = config;
        // Get only the env vars from the client's JSON config, NOT from .env
        this.capturedEnv = getCapturedEnv();

        // Initialiser le serveur local (interface pour Claude/Cursor)
        this.server = new Server(
            {
                name: "mcp-uplink",
                version: "0.2.0",
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
     * Transfère la requête vers la plateforme distante via HTTP (utilise fetch natif)
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
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error?.message || errorMessage;
                } catch {
                    // Ignore JSON parse error, use default message
                }
                throw new Error(`Remote MCP Error: ${errorMessage}`);
            }

            const data = await response.json() as { error?: { message?: string }; result?: T };

            if (data.error) {
                throw new Error(data.error.message || "Unknown remote error");
            }

            return data.result as T;
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error(`Remote MCP Error: Network error - ${error.message}`);
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

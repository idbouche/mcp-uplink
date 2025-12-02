import { z } from 'zod';
import dotenv from 'dotenv';

// Charger les variables d'environnement locales si un fichier .env existe
dotenv.config();

// Schéma de validation de la configuration
export const ConfigSchema = z.object({
    mcpUrl: z.string().url({ message: "Invalid MCP Server URL" }),
    apiKey: z.string().min(1, { message: "MCP API Key is required" }),
    forwardEnv: z.boolean().default(true),
    envPrefix: z.string().optional(),
    enabledTools: z.string().optional(), // Liste séparée par des virgules
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(args: Record<string, unknown>): Config {
    // Priorité : Arguments CLI > Variables d'environnement
    const rawConfig = {
        mcpUrl: args.url || process.env.MCP_SERVER_URL,
        apiKey: args.apiKey || process.env.MCP_API_KEY,
        forwardEnv: args.forwardEnv !== 'false', // Par défaut true
        envPrefix: args.envPrefix || process.env.MCP_ENV_PREFIX,
        enabledTools: args.enabledTools || process.env.MCP_ENABLED_TOOLS,
    };

    try {
        return ConfigSchema.parse(rawConfig);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("❌ Configuration Error:");
            error.errors.forEach((err) => {
                console.error(`   - ${err.path.join('.')}: ${err.message}`);
            });
            process.exit(1);
        }
        throw error;
    }
}

/**
 * Capture les variables d'environnement pertinentes à transférer
 */
export function captureEnvironment(config: Config): Record<string, string> {
    if (!config.forwardEnv) return {};

    const env: Record<string, string> = {};

    // Liste noire des variables système à ne PAS transférer
    const blacklist = new Set([
        'PATH', 'SHELL', 'TERM', 'USER', 'HOME', 'PWD', 'OLDPWD',
        'SHLVL', 'LOGNAME', 'SSH_CLIENT', 'SSH_CONNECTION', 'SSH_TTY',
        'MCP_API_KEY', 'MCP_SERVER_URL', 'NODE_ENV'
    ]);

    for (const [key, value] of Object.entries(process.env)) {
        if (!value) continue;

        // Si un préfixe est défini, on ne prend que ce qui matche
        if (config.envPrefix && !key.startsWith(config.envPrefix)) {
            continue;
        }

        // Sinon on prend tout sauf la blacklist
        if (!config.envPrefix && blacklist.has(key)) {
            continue;
        }

        env[key] = value;
    }

    return env;
}

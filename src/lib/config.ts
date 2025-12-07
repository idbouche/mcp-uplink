import { z } from 'zod';

// Schéma de validation de la configuration
export const ConfigSchema = z.object({
    mcpUrl: z.string().url({ message: "Invalid MCP Server URL" }),
    apiKey: z.string().min(1, { message: "MCP API Key is required" }),
    enabledTools: z.string().optional(), // Liste séparée par des virgules
});

export type Config = z.infer<typeof ConfigSchema>;

// Liste des variables internes à ne PAS transférer vers le serveur
const INTERNAL_VARS = new Set([
    'MCP_API_KEY',
    'MCP_ENABLED_TOOLS',
    'MCP_SERVER_URL',
]);

/**
 * Variables d'environnement passées par le client MCP (Claude, Cursor, etc.)
 * via la section "env" du fichier de configuration JSON.
 * 
 * IMPORTANT: On ne lit PAS .env ni process.env système.
 * On capture UNIQUEMENT ce que l'utilisateur a défini dans sa config JSON.
 */
let capturedClientEnv: Record<string, string> = {};

/**
 * Capture les variables d'environnement au démarrage du processus.
 * Ces variables viennent UNIQUEMENT de la section "env" de la config JSON
 * (Claude Desktop, Cursor, etc.), car c'est ainsi que le processus est lancé.
 * 
 * On ne lit PAS les fichiers .env ni les variables système.
 */
export function captureClientEnv(): void {
    // Le processus node est lancé avec les env vars de la config JSON
    // On filtre pour ne garder que les variables pertinentes (pas les système)
    const systemVars = new Set([
        'PATH', 'SHELL', 'TERM', 'USER', 'HOME', 'PWD', 'OLDPWD',
        'SHLVL', 'LOGNAME', 'SSH_CLIENT', 'SSH_CONNECTION', 'SSH_TTY',
        'NODE_ENV', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TMPDIR', 'TERM_PROGRAM',
        'TERM_PROGRAM_VERSION', 'COLORTERM', 'DISPLAY', 'EDITOR', 'VISUAL',
        'XDG_SESSION_TYPE', 'XDG_CURRENT_DESKTOP', 'XDG_SESSION_ID',
        'DBUS_SESSION_BUS_ADDRESS', 'SSH_AUTH_SOCK', 'GPG_AGENT_INFO',
        '_', '__CF_USER_TEXT_ENCODING', 'Apple_PubSub_Socket_Render',
        'COMMAND_MODE', 'SECURITYSESSIONID', 'LaunchInstanceID',
        // npm/node internal vars
        'npm_config_registry', 'npm_config_user_agent', 'npm_lifecycle_event',
        'npm_lifecycle_script', 'npm_package_json', 'npm_package_name',
        'npm_package_version', 'npm_node_execpath', 'npm_execpath',
        'NODE_PATH', 'NODE_OPTIONS', 'NVM_DIR', 'NVM_CD_FLAGS', 'NVM_BIN',
        'NVM_INC', 'MANPATH', 'INFOPATH',
    ]);

    capturedClientEnv = {};

    for (const [key, value] of Object.entries(process.env)) {
        if (!value) continue;

        // Skip system variables
        if (systemVars.has(key)) continue;

        // Skip npm_ prefixed variables
        if (key.startsWith('npm_')) continue;

        // Skip internal MCP Uplink variables
        if (INTERNAL_VARS.has(key)) continue;

        capturedClientEnv[key] = value;
    }
}

/**
 * Retourne les variables d'environnement capturées du client
 */
export function getCapturedEnv(): Record<string, string> {
    return { ...capturedClientEnv };
}

export function loadConfig(args: Record<string, unknown>): Config {
    // Capture les variables d'environnement du client AVANT tout
    captureClientEnv();

    // Priorité : Arguments CLI > Variables d'environnement
    const rawConfig = {
        mcpUrl: args.url || process.env.MCP_SERVER_URL,
        apiKey: args.apiKey || process.env.MCP_API_KEY,
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

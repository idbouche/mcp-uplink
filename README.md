# MCP Bridge CLI 🌉

**Securely connect local AI clients (Claude Desktop, Cursor, VS Code) to remote MCP infrastructure.**

The `mcp-bridge` CLI acts as a local proxy. It runs on your machine, captures your local environment variables (like API keys), and securely forwards them to the remote MCP Provider platform via encrypted HTTP headers.

**✅ Zero Trust Architecture**: Your secrets (Slack tokens, GitHub keys) never leave your machine's configuration until the moment they are needed, and are never stored on the server.

## Usage with Claude Desktop (Standard Configuration)

Add this to your `claude_desktop_config.json` (Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`).

This configuration uses the standard MCP Stdio transport, supported by all major clients (Claude, Cursor, etc.).

```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": [
        "-y",
        "@mcp-provider/cli",
        "connect",
        "--url", "https://api.your-platform.com/api/mcp/slack"
      ],
      "env": {
        "MCP_API_KEY": "YOUR_PLATFORM_API_KEY",
        "SLACK_BOT_TOKEN": "xoxb-your-slack-token-here",
        "MCP_ENABLED_TOOLS": "send_message,list_users"
      }
    }
  }
}
```

### Why this is secure (Zero Trust)
1. **Local Execution**: `npx` runs the bridge locally on your machine.
2. **Ephemeral Secrets**: `SLACK_BOT_TOKEN` is passed only to this local process.
3. **Secure Transport**: The bridge encrypts your keys and sends them via HTTPS headers (`X-Mcp-Env`) to the platform.
4. **No Storage**: The platform executes the request and forgets the keys immediately.

## How it Works

1. **Claude Desktop** starts `mcp-bridge` locally using the `command` and `args`.
2. **Claude** passes the `env` variables to the bridge process.
3. **mcp-bridge** connects to the remote URL defined in `--url`.
4. **mcp-bridge** injects the environment variables into a secure HTTP header (`X-Mcp-Env`).
5. **Remote Server** receives the request, decrypts the env vars, and executes the MCP tool.

## Options

| Option | Description |
|--------|-------------|
| `-u, --url <url>` | **Required**. The full URL of the remote MCP endpoint. |
| `-k, --api-key <key>` | **Optional**. Your platform API key (can also be set via `MCP_API_KEY` env var). |
| `--no-forward-env` | Disable environment variable forwarding. |
| `--env-prefix <prefix>` | Only forward environment variables starting with this prefix (e.g., `MY_APP_`). |
| `--enabled-tools <list>` | Comma-separated list of tools to enable (e.g., `send_message,list_users`). |

## Security

*   **Ephemeral Secrets**: Secrets are transmitted in-memory and are not stored on the remote server.
*   **Transport Security**: Always use `https://` URLs to ensure headers are encrypted in transit.
*   **Filtering**: By default, system environment variables (PATH, SHELL, etc.) are NOT forwarded.

## License

MIT

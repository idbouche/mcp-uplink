# MCP Uplink 🚀

[![npm version](https://img.shields.io/npm/v/mcp-uplink.svg)](https://www.npmjs.com/package/mcp-uplink)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

**The official CLI for [MCP Uplink](https://mcp-uplink.com) - Cloud MCP Hosting for AI Agents**

> **Your AI Agents: Faster, Cheaper, Safer**

Connect Claude Desktop, Cursor, VS Code, Windsurf and any MCP-compatible AI client to the MCP Uplink cloud platform.

---

## ⚡ Why MCP Uplink?

| Problem | Solution |
|---------|----------|
| 🔥 **Too many tokens** | Only load the tools you need. Reduce context by 60%. |
| 💸 **High API costs** | Fewer tokens = lower costs. Calculate savings at [mcp-calculator](https://mcp-uplink.com/mcp-calculator) |
| 🤖 **LLM hallucinations** | Less noise = more accurate responses. Specialized agents perform better. |
| 🔐 **Security concerns** | Zero Trust: Your credentials NEVER leave your machine. |
| ⚙️ **Infrastructure headaches** | We manage MCP servers. You focus on building. |

---

## 🎯 3 Pillars for Optimal AI Agents

### 1. 🧠 Intelligent Tool Filtering
Reduce your context window by only exposing the tools your agent actually needs.

```
❌ Native MCP: Sends ALL 50+ tool definitions → Heavy load, confused LLM
✅ MCP Uplink: Only sends 5 tools you need → Fast, focused, accurate
```

**Result:** 60% less tokens, fewer hallucinations, better responses.

### 2. 🔐 Dual-Layer Security

**Layer 1: Zero Trust Architecture**
- Your API keys and tokens stay in YOUR local `.env` file
- Secrets are transmitted in-memory via encrypted HTTPS headers
- **We NEVER store your credentials** - we're just a secure proxy

**Layer 2: Tool Blocking**
- Block dangerous tools like `delete`, `drop`, `modify`
- Prevent catastrophic accidents where an agent deletes your database

### 3. 💰 Maximum Performance, Minimum Cost

- Less noise = faster and more accurate LLM responses
- Agents respond instantly with higher quality answers
- Managed infrastructure = no DevOps overhead for you

---

## 📦 Installation

No installation required! Just use `npx`:

```bash
npx mcp-uplink connect --url https://mcp-uplink.com/api/mcp/slack
```

Or install globally for faster startup:

```bash
npm install -g mcp-uplink
```

---

## 🚀 Quick Start

### Claude Desktop Configuration

Add this to your `claude_desktop_config.json`:

| OS | Path |
|----|------|
| **Mac** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%/Claude/claude_desktop_config.json` |
| **Linux** | `~/.config/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-uplink",
        "connect",
        "--url", "https://mcp-uplink.com/api/mcp/slack"
      ],
      "env": {
        "MCP_API_KEY": "your-mcp-uplink-api-key",
        "MCP_ENABLED_TOOLS": "send_message,list_channels",
        "SLACK_BOT_TOKEN": "xoxb-your-slack-token",
        "SLACK_TEAM_ID": "T0123456789"
      }
    }
  }
}
```

### Cursor / VS Code / Windsurf

Same configuration format - just add to your MCP settings.

---

## ⚙️ CLI Options

| Option | Description |
|--------|-------------|
| `-u, --url <url>` | **Required**. MCP Uplink endpoint URL |
| `-k, --api-key <key>` | Platform API key (or set `MCP_API_KEY` env var) |
| `--enabled-tools <list>` | Comma-separated list of tools to enable |
| `--no-forward-env` | Disable environment variable forwarding |
| `--env-prefix <prefix>` | Only forward env vars with this prefix |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `MCP_API_KEY` | Your MCP Uplink API key |
| `MCP_ENABLED_TOOLS` | Tools to enable (e.g., `send_message,list_users`) |
| `MCP_SERVER_URL` | Default server URL |
| `MCP_ENV_PREFIX` | Prefix filter for env vars |

---

## 🔒 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR MACHINE (Secure)                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  .env file                                           │   │
│  │  SLACK_BOT_TOKEN=xoxb-xxx (never leaves here)        │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  mcp-uplink CLI (local process)                      │   │
│  │  - Captures env vars in-memory                       │   │
│  │  - Encrypts via HTTPS header (X-Mcp-Env)             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ HTTPS (encrypted)
┌─────────────────────────────────────────────────────────────┐
│  MCP UPLINK CLOUD                                           │
│  - Receives request                                         │
│  - Decrypts env vars IN-MEMORY ONLY                         │
│  - Executes MCP tool                                        │
│  - Immediately forgets credentials (no storage)             │
└─────────────────────────────────────────────────────────────┘
```

**Key Security Features:**
- ✅ **Ephemeral Secrets**: Never stored, only used in-memory
- ✅ **HTTPS Transport**: All data encrypted in transit
- ✅ **Blacklist Filtering**: System vars (PATH, SHELL) are never forwarded
- ✅ **Tool Blocking**: Prevent dangerous operations

---

## 📊 How It Works

```mermaid
sequenceDiagram
    participant Claude as Claude Desktop
    participant Bridge as mcp-uplink (local)
    participant Cloud as MCP Uplink Cloud
    participant MCP as MCP Server

    Claude->>Bridge: tools/list
    Bridge->>Cloud: POST /api/mcp/slack (+ X-Mcp-Env header)
    Cloud->>MCP: Execute with filtered tools
    MCP-->>Cloud: Tool definitions
    Cloud-->>Bridge: Filtered response
    Bridge-->>Claude: Only enabled tools
```

---

## 🔗 Links

- **Website**: [https://mcp-uplink.com](https://mcp-uplink.com)
- **Cost Calculator**: [https://mcp-uplink.com/mcp-calculator](https://mcp-uplink.com/mcp-calculator)
- **MCP Marketplace**: [https://mcp-uplink.com/marketplace](https://mcp-uplink.com/marketplace)
- **Documentation**: [https://mcp-uplink.com/docs](https://mcp-uplink.com/docs)
- **GitHub**: [https://github.com/idbouche/mcp-uplink](https://github.com/idbouche/mcp-uplink)

---

## 📄 License

MIT © [MCP Uplink](https://mcp-uplink.com)

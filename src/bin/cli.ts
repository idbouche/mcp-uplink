#!/usr/bin/env node
import { Command } from 'commander';
import { loadConfig } from '../lib/config.js';
import { McpBridge } from '../lib/bridge.js';

const program = new Command();

program
    .name('mcp-uplink')
    .description('Connect local AI clients (Claude, Cursor) to remote MCP infrastructure securely')
    .version('0.1.0');

program
    .command('connect')
    .description('Start the bridge in stdio mode')
    .requiredOption('-u, --url <url>', 'Remote MCP Server URL (e.g., https://mcp-uplink.com/api/mcp/slack)')
    .option('-k, --api-key <key>', 'MCP Platform API Key')
    .option('--no-forward-env', 'Disable environment variable forwarding')
    .option('--env-prefix <prefix>', 'Only forward environment variables starting with this prefix')
    .option('--enabled-tools <tools>', 'Comma-separated list of tools to enable')
    .action(async (options) => {
        try {
            const config = loadConfig(options);
            const bridge = new McpBridge(config);
            await bridge.start();
        } catch (error) {
            console.error('Fatal Error:', error);
            process.exit(1);
        }
    });

program.parse(process.argv);

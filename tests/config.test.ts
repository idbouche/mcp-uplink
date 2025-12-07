import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCapturedEnv, captureClientEnv, loadConfig } from '../src/lib/config.js';

describe('Config & Environment Capture', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should load config from args', () => {
        const args = {
            url: 'https://api.test.com',
            apiKey: 'test-key',
        };
        const config = loadConfig(args);
        expect(config.mcpUrl).toBe('https://api.test.com');
        expect(config.apiKey).toBe('test-key');
    });

    it('should capture allowed environment variables', () => {
        // Setup mock environment with mixed variables
        process.env.SLACK_BOT_TOKEN = 'xoxb-123';
        process.env.GITHUB_TOKEN = 'ghp-456';
        process.env.PATH = '/usr/bin'; // Should be ignored
        process.env.npm_package_version = '1.0.0'; // Should be ignored

        // Trigger capture explicitly (usually called by loadConfig)
        captureClientEnv();
        const captured = getCapturedEnv();

        expect(captured['SLACK_BOT_TOKEN']).toBe('xoxb-123');
        expect(captured['GITHUB_TOKEN']).toBe('ghp-456');

        // System variables should be ignored
        expect(captured['PATH']).toBeUndefined();
        expect(captured['npm_package_version']).toBeUndefined();
    });

    it('should capture env vars via loadConfig flow', () => {
        process.env.API_KEY = 'secret';

        loadConfig({
            url: 'https://api.test.com',
            apiKey: 'key'
        });

        const captured = getCapturedEnv();
        expect(captured['API_KEY']).toBe('secret');
    });

    it('should ignore internal MCP vars', () => {
        process.env.MCP_API_KEY = 'do-not-forward';
        process.env.MCP_SERVER_URL = 'https://...';
        process.env.USER_VAR = 'forward-me';

        captureClientEnv();
        const captured = getCapturedEnv();

        expect(captured['MCP_API_KEY']).toBeUndefined();
        expect(captured['MCP_SERVER_URL']).toBeUndefined();
        expect(captured['USER_VAR']).toBe('forward-me');
    });
});

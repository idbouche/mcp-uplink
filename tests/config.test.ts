import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { captureEnvironment, loadConfig } from '../src/lib/config.js';

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
            forwardEnv: 'true',
        };
        const config = loadConfig(args);
        expect(config.mcpUrl).toBe('https://api.test.com');
        expect(config.apiKey).toBe('test-key');
        expect(config.forwardEnv).toBe(true);
    });

    it('should capture environment variables', () => {
        process.env.TEST_VAR = 'secret-value';
        process.env.OTHER_VAR = 'other';

        const config = loadConfig({
            url: 'https://api.test.com',
            apiKey: 'key',
            forwardEnv: 'true'
        });

        const captured = captureEnvironment(config);
        expect(captured['TEST_VAR']).toBe('secret-value');
        expect(captured['OTHER_VAR']).toBe('other');
    });

    it('should filter environment variables by prefix', () => {
        process.env.MYAPP_SECRET = 'secret';
        process.env.OTHER_VAR = 'ignored';

        const config = loadConfig({
            url: 'https://api.test.com',
            apiKey: 'key',
            forwardEnv: 'true',
            envPrefix: 'MYAPP_'
        });

        const captured = captureEnvironment(config);
        expect(captured['MYAPP_SECRET']).toBe('secret');
        expect(captured['OTHER_VAR']).toBeUndefined();
    });

    it('should blacklist system variables', () => {
        process.env.PATH = '/usr/bin';
        process.env.USER = 'root';
        process.env.CUSTOM_VAR = 'ok';

        const config = loadConfig({
            url: 'https://api.test.com',
            apiKey: 'key',
            forwardEnv: 'true'
        });

        const captured = captureEnvironment(config);
        expect(captured['PATH']).toBeUndefined();
        expect(captured['USER']).toBeUndefined();
        expect(captured['CUSTOM_VAR']).toBe('ok');
    });
});

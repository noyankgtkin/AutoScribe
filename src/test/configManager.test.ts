import * as assert from 'assert';
import { ConfigManager } from '../configManager';

suite('ConfigManager Unit Tests', () => {
    test('getConfig returns default values when no user overrides exist', () => {
        const config = ConfigManager.getConfig();

        assert.strictEqual(typeof config.enabled, 'boolean');
        assert.strictEqual(typeof config.backupMode, 'string');
        assert.strictEqual(typeof config.intervalMinutes, 'number');
        assert.ok(config.intervalMinutes >= 1, 'intervalMinutes must be at least 1');
        assert.strictEqual(typeof config.gitAutoPush, 'boolean');
        assert.strictEqual(typeof config.pushStrategy, 'string');
        assert.strictEqual(typeof config.pushIntervalMinutes, 'number');
        assert.ok(config.pushIntervalMinutes >= 1, 'pushIntervalMinutes must be at least 1');
        assert.strictEqual(typeof config.commitMessagePrefix, 'string');
        assert.strictEqual(typeof config.syncOnStartup, 'boolean');
    });

    test('getConfig backupMode and pushStrategy are valid enum values', () => {
        const config = ConfigManager.getConfig();
        const validModes = ['onSave', 'interval', 'both', 'manual'];
        assert.ok(
            validModes.includes(config.backupMode),
            `backupMode '${config.backupMode}' should be one of ${validModes.join(', ')}`
        );

        const validStrategies = ['onCommit', 'interval', 'manual'];
        assert.ok(
            validStrategies.includes(config.pushStrategy),
            `pushStrategy '${config.pushStrategy}' should be one of ${validStrategies.join(', ')}`
        );
    });
});

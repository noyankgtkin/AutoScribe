import * as assert from 'assert';
import { StatusBarManager } from '../statusBarManager';

suite('StatusBarManager Unit Tests', () => {
    let statusBar: StatusBarManager;

    setup(() => {
        statusBar = new StatusBarManager();
    });

    teardown(() => {
        statusBar.dispose();
    });

    test('Initial state is idle', () => {
        assert.strictEqual(statusBar.getText(), '$(check) AutoScribe');
        assert.strictEqual(statusBar.getTooltip(), 'AutoScribe: Ready. Click to backup now.');
    });

    test('setIdle with Date updates text with timestamp', () => {
        const testDate = new Date(2026, 6, 31, 14, 30);
        statusBar.setIdle(testDate);
        assert.ok(statusBar.getText().includes('$(check) AutoScribe'));
        assert.ok(statusBar.getText().includes('14:30') || statusBar.getText().includes('02:30'));
    });

    test('setSyncing updates status bar to spinning sync', () => {
        statusBar.setSyncing();
        assert.strictEqual(statusBar.getText(), '$(sync~spin) AutoScribe: Backing up...');
    });

    test('setNoChanges updates status bar to clean state', () => {
        statusBar.setNoChanges();
        assert.strictEqual(statusBar.getText(), '$(check) AutoScribe: Clean');
    });

    test('setError updates status bar to error state', () => {
        statusBar.setError('Git connection failed');
        assert.strictEqual(statusBar.getText(), '$(error) AutoScribe: Error');
        assert.ok(String(statusBar.getTooltip()).includes('Git connection failed'));
    });

    test('setDisabled updates status bar to disabled state', () => {
        statusBar.setDisabled();
        assert.strictEqual(statusBar.getText(), '$(circle-slash) AutoScribe');
    });
});

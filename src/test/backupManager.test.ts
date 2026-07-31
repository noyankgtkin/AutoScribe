import * as assert from 'assert';
import { StatusBarManager } from '../statusBarManager';
import { BackupManager } from '../backupManager';

suite('BackupManager Unit Tests', () => {
    let statusBar: StatusBarManager;
    let backupManager: BackupManager;

    setup(() => {
        statusBar = new StatusBarManager();
        backupManager = new BackupManager(statusBar);
    });

    teardown(() => {
        backupManager.dispose();
        statusBar.dispose();
    });

    test('BackupManager initializes without error', () => {
        assert.ok(backupManager);
    });

    test('reloadConfig re-evaluates settings without error', () => {
        assert.doesNotThrow(() => {
            backupManager.reloadConfig();
        });
    });

    test('triggerBackup(true) handles manual backup execution', async () => {
        await backupManager.triggerBackup(true);
        const statusText = statusBar.getText();
        assert.ok(
            statusText.includes('Clean') || statusText.includes('AutoScribe'),
            `Unexpected status text: ${statusText}`
        );
    });
});

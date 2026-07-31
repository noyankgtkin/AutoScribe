import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Integration Tests', () => {
    test('Extension triggers activation and registers commands', async () => {
        const ext = vscode.extensions.all.find(e => e.packageJSON && e.packageJSON.name === 'autoscribe');
        assert.ok(ext, 'AutoScribe extension should be loaded in VS Code test environment');
        if (ext && !ext.isActive) {
            await ext.activate();
        }
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('autoscribe.setup'), 'autoscribe.setup command registered');
        assert.ok(commands.includes('autoscribe.syncNow'), 'autoscribe.syncNow command registered');
        assert.ok(commands.includes('autoscribe.toggle'), 'autoscribe.toggle command registered');
    });
});

import * as vscode from 'vscode';

export class StatusBarManager implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'autoscribe.syncNow';
        this.statusBarItem.show();
        this.setIdle();
    }

    public getText(): string {
        return this.statusBarItem.text;
    }

    public getTooltip(): string | vscode.MarkdownString | undefined {
        return this.statusBarItem.tooltip;
    }

    public setIdle(lastBackupTime?: Date): void {
        this.statusBarItem.command = 'autoscribe.syncNow';
        if (lastBackupTime) {
            const timeStr = lastBackupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.statusBarItem.text = `$(check) AutoScribe (${timeStr})`;
            this.statusBarItem.tooltip = `AutoScribe: Last backup at ${timeStr}. Click to backup now.`;
        } else {
            this.statusBarItem.text = '$(check) AutoScribe';
            this.statusBarItem.tooltip = 'AutoScribe: Ready. Click to backup now.';
        }
        this.statusBarItem.backgroundColor = undefined;
    }

    public setSyncing(): void {
        this.statusBarItem.command = 'autoscribe.syncNow';
        this.statusBarItem.text = '$(sync~spin) AutoScribe: Backing up...';
        this.statusBarItem.tooltip = 'AutoScribe: Backing up changes to Git...';
        this.statusBarItem.backgroundColor = undefined;
    }

    public setNoChanges(): void {
        this.statusBarItem.command = 'autoscribe.syncNow';
        this.statusBarItem.text = '$(check) AutoScribe: Clean';
        this.statusBarItem.tooltip = 'AutoScribe: No uncommitted changes found.';
        this.statusBarItem.backgroundColor = undefined;
    }

    public setError(message: string): void {
        this.statusBarItem.command = 'autoscribe.syncNow';
        this.statusBarItem.text = '$(error) AutoScribe: Error';
        this.statusBarItem.tooltip = `AutoScribe Error: ${message}. Click to retry.`;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }

    public setDisabled(): void {
        this.statusBarItem.command = 'autoscribe.syncNow';
        this.statusBarItem.text = '$(circle-slash) AutoScribe';
        this.statusBarItem.tooltip = 'AutoScribe: Auto-backup is disabled. Click to backup manually.';
        this.statusBarItem.backgroundColor = undefined;
    }

    public setNeedSetup(): void {
        this.statusBarItem.command = 'autoscribe.setup';
        this.statusBarItem.text = '$(wand) AutoScribe: Setup Notes';
        this.statusBarItem.tooltip = 'AutoScribe: Click to run setup wizard and connect to GitHub.';
        this.statusBarItem.backgroundColor = undefined;
    }

    public setIgnoredWorkspace(): void {
        this.statusBarItem.command = 'autoscribe.setup';
        this.statusBarItem.text = '$(shield) AutoScribe: Ignored';
        this.statusBarItem.tooltip = 'AutoScribe: Ignored project workspace (Protected). Click to setup a separate personal notes workspace.';
        this.statusBarItem.backgroundColor = undefined;
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}

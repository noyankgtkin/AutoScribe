import * as vscode from 'vscode';
import { ConfigManager, AutoScribeConfig } from './configManager';
import { StatusBarManager } from './statusBarManager';
import { GitService } from './gitService';
import { WorkspaceSafetyService } from './workspaceSafetyService';

export class BackupManager implements vscode.Disposable {
    private config: AutoScribeConfig;
    private statusBar: StatusBarManager;
    private gitService: GitService;
    private disposables: vscode.Disposable[] = [];
    private backupIntervalTimer: NodeJS.Timeout | undefined;
    private pushIntervalTimer: NodeJS.Timeout | undefined;
    private saveDebounceTimer: NodeJS.Timeout | undefined;
    private isSyncing = false;

    constructor(statusBar: StatusBarManager) {
        this.statusBar = statusBar;
        this.gitService = new GitService();
        this.config = ConfigManager.getConfig();

        this.setupListenersAndTimers();
        this.checkGitState();

        if (this.config.enabled && this.config.syncOnStartup) {
            this.triggerBackup(false);
        }
    }

    public async checkGitState(): Promise<void> {
        const isRepo = await this.gitService.isGitRepo();
        if (!isRepo) {
            this.statusBar.setNeedSetup();
            return;
        }

        const isNotes = WorkspaceSafetyService.isNotesWorkspace(this.gitService.getWorkspaceRoot());
        if (!isNotes) {
            this.statusBar.setIgnoredWorkspace();
            return;
        }

        this.statusBar.setIdle();
    }

    public getGitService(): GitService {
        return this.gitService;
    }

    public reloadConfig(): void {
        this.config = ConfigManager.getConfig();
        this.setupListenersAndTimers();
        if (!this.config.enabled) {
            this.statusBar.setDisabled();
        } else {
            this.checkGitState();
        }
    }

    public async toggleEnabled(): Promise<boolean> {
        const targetValue = !this.config.enabled;
        const configuration = vscode.workspace.getConfiguration('autoscribe');
        await configuration.update('enabled', targetValue, vscode.ConfigurationTarget.Global);
        this.reloadConfig();
        return targetValue;
    }

    private setupListenersAndTimers(): void {
        if (this.backupIntervalTimer) {
            clearInterval(this.backupIntervalTimer);
            this.backupIntervalTimer = undefined;
        }
        if (this.pushIntervalTimer) {
            clearInterval(this.pushIntervalTimer);
            this.pushIntervalTimer = undefined;
        }
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
            this.saveDebounceTimer = undefined;
        }
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];

        if (!this.config.enabled) {
            this.statusBar.setDisabled();
            return;
        }

        if (this.config.backupMode === 'onSave' || this.config.backupMode === 'both') {
            const saveListener = vscode.workspace.onDidSaveTextDocument(() => {
                this.onFileSaved();
            });
            this.disposables.push(saveListener);
        }

        if (this.config.backupMode === 'interval' || this.config.backupMode === 'both') {
            const backupMs = this.config.intervalMinutes * 60 * 1000;
            this.backupIntervalTimer = setInterval(() => {
                this.triggerBackup(false);
            }, backupMs);
        }

        if (this.config.gitAutoPush && this.config.pushStrategy === 'interval') {
            const pushMs = this.config.pushIntervalMinutes * 60 * 1000;
            this.pushIntervalTimer = setInterval(() => {
                this.triggerPushOnly();
            }, pushMs);
        }
    }

    private onFileSaved(): void {
        if (!this.config.enabled) {
            return;
        }

        if (!WorkspaceSafetyService.isNotesWorkspace(this.gitService.getWorkspaceRoot())) {
            return;
        }

        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }

        this.saveDebounceTimer = setTimeout(() => {
            this.triggerBackup(false);
        }, 3000);
    }

    public async triggerBackup(manual = false): Promise<void> {
        if (!this.config.enabled && !manual) {
            return;
        }

        if (!WorkspaceSafetyService.isNotesWorkspace(this.gitService.getWorkspaceRoot()) && !manual) {
            this.statusBar.setIgnoredWorkspace();
            return;
        }

        if (this.isSyncing) {
            if (manual) {
                vscode.window.showInformationMessage('AutoScribe: A backup operation is already in progress.');
            }
            return;
        }

        this.isSyncing = true;
        this.statusBar.setSyncing();

        try {
            const commitResult = await this.gitService.performCommit(this.config.commitMessagePrefix);

            if (!commitResult.success) {
                this.statusBar.setError(commitResult.message);
                if (manual) {
                    vscode.window.showErrorMessage(`AutoScribe Error: ${commitResult.message}`);
                }
                return;
            }

            let shouldPush = false;
            if (this.config.gitAutoPush) {
                if (manual) {
                    shouldPush = true;
                } else if (this.config.pushStrategy === 'onCommit') {
                    shouldPush = commitResult.committed;
                }
            }

            let pushSuccess = false;
            if (shouldPush) {
                const pushResult = await this.gitService.performPush();
                pushSuccess = pushResult.success;
            }

            const now = new Date();
            if (commitResult.committed || pushSuccess) {
                this.statusBar.setIdle(now);
                if (manual) {
                    const msg = shouldPush && pushSuccess ? 'Backup committed & pushed to remote.' : 'Backup committed locally.';
                    vscode.window.showInformationMessage(`AutoScribe: ${msg}`);
                }
            } else {
                this.statusBar.setNoChanges();
                if (manual) {
                    vscode.window.showInformationMessage('AutoScribe: No changes to backup.');
                }
            }

        } catch (error: any) {
            const errMsg = error.message || String(error);
            this.statusBar.setError(errMsg);
            if (manual) {
                vscode.window.showErrorMessage(`AutoScribe Error: ${errMsg}`);
            }
        } finally {
            this.isSyncing = false;
        }
    }

    public async triggerPushOnly(): Promise<void> {
        if (!this.config.enabled || !this.config.gitAutoPush || this.isSyncing) {
            return;
        }

        if (!WorkspaceSafetyService.isNotesWorkspace(this.gitService.getWorkspaceRoot())) {
            return;
        }

        this.isSyncing = true;
        this.statusBar.setSyncing();

        try {
            const pushResult = await this.gitService.performPush();
            if (pushResult.success) {
                this.statusBar.setIdle(new Date());
            } else {
                this.statusBar.setError(pushResult.message);
            }
        } catch (error: any) {
            this.statusBar.setError(error.message || String(error));
        } finally {
            this.isSyncing = false;
        }
    }

    public dispose(): void {
        if (this.backupIntervalTimer) {
            clearInterval(this.backupIntervalTimer);
        }
        if (this.pushIntervalTimer) {
            clearInterval(this.pushIntervalTimer);
        }
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }
        this.disposables.forEach(d => d.dispose());
    }
}

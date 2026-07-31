import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface CommitResult {
    success: boolean;
    committed: boolean;
    message: string;
}

export interface PushResult {
    success: boolean;
    pushed: boolean;
    message: string;
}

export interface SyncResult {
    success: boolean;
    committed: boolean;
    pushed: boolean;
    message: string;
}

export class GitService {
    private customRoot?: string;

    constructor(customRoot?: string) {
        this.customRoot = customRoot;
    }

    public getWorkspaceRoot(): string | undefined {
        if (this.customRoot !== undefined) {
            return this.customRoot;
        }
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return undefined;
        }
        return workspaceFolders[0].uri.fsPath;
    }

    public async isGitRepo(): Promise<boolean> {
        const root = this.getWorkspaceRoot();
        if (!root) {
            return false;
        }
        try {
            await execFileAsync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root });
            return true;
        } catch {
            return false;
        }
    }

    public async initializeRepo(remoteUrl: string): Promise<{ success: boolean; message: string }> {
        const root = this.getWorkspaceRoot();
        if (!root) {
            return { success: false, message: 'No workspace folder open.' };
        }

        try {
            const isRepo = await this.isGitRepo();
            if (!isRepo) {
                await execFileAsync('git', ['init'], { cwd: root });
            }
            await execFileAsync('git', ['branch', '-M', 'main'], { cwd: root }).catch(() => {});

            try {
                await execFileAsync('git', ['remote', 'add', 'origin', remoteUrl], { cwd: root });
            } catch {
                await execFileAsync('git', ['remote', 'set-url', 'origin', remoteUrl], { cwd: root });
            }

            await execFileAsync('git', ['add', '.'], { cwd: root });
            await execFileAsync('git', ['commit', '-m', 'Initial notes backup setup by AutoScribe'], { cwd: root }).catch(() => {});
            await execFileAsync('git', ['push', '-u', 'origin', 'main'], { cwd: root }).catch(() => {});

            return { success: true, message: 'Repository initialized and connected to GitHub successfully.' };
        } catch (error: any) {
            return { success: false, message: error.message || String(error) };
        }
    }

    public async performCommit(commitPrefix: string): Promise<CommitResult> {
        const root = this.getWorkspaceRoot();
        if (!root) {
            return {
                success: false,
                committed: false,
                message: 'No workspace folder open.'
            };
        }

        const isRepo = await this.isGitRepo();
        if (!isRepo) {
            return {
                success: false,
                committed: false,
                message: 'Workspace is not a Git repository.'
            };
        }

        try {
            const { stdout: statusOutput } = await execFileAsync('git', ['status', '--porcelain'], { cwd: root });
            if (!statusOutput || statusOutput.trim().length === 0) {
                return {
                    success: true,
                    committed: false,
                    message: 'No changes to commit.'
                };
            }

            await execFileAsync('git', ['add', '.'], { cwd: root });

            const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
            const commitMsg = `${commitPrefix.trim()} ${timestamp}`;

            await execFileAsync('git', ['commit', '-m', commitMsg], { cwd: root });

            return {
                success: true,
                committed: true,
                message: 'Backup committed locally.'
            };
        } catch (error: any) {
            return {
                success: false,
                committed: false,
                message: error.message || String(error)
            };
        }
    }

    public async performPush(): Promise<PushResult> {
        const root = this.getWorkspaceRoot();
        if (!root) {
            return {
                success: false,
                pushed: false,
                message: 'No workspace folder open.'
            };
        }

        try {
            await execFileAsync('git', ['push'], { cwd: root });
            return {
                success: true,
                pushed: true,
                message: 'Pushed local commits to remote repository.'
            };
        } catch (error: any) {
            return {
                success: false,
                pushed: false,
                message: `Git push failed: ${error.message || String(error)}`
            };
        }
    }

    public async performBackup(commitPrefix: string, autoPush: boolean): Promise<SyncResult> {
        const commitResult = await this.performCommit(commitPrefix);
        if (!commitResult.success) {
            return {
                success: false,
                committed: false,
                pushed: false,
                message: commitResult.message
            };
        }

        let pushed = false;
        let finalMessage = commitResult.message;

        if (autoPush) {
            const pushResult = await this.performPush();
            if (pushResult.success) {
                pushed = true;
                finalMessage = commitResult.committed
                    ? 'Backup completed (committed & pushed).'
                    : 'Pushed local commits to remote repository.';
            } else {
                if (commitResult.committed) {
                    finalMessage = `Committed locally, but push failed: ${pushResult.message}`;
                } else {
                    finalMessage = pushResult.message;
                }
            }
        }

        return {
            success: true,
            committed: commitResult.committed,
            pushed,
            message: finalMessage
        };
    }
}

import * as vscode from 'vscode';
import * as path from 'path';
import { StatusBarManager } from './statusBarManager';
import { BackupManager } from './backupManager';
import { SetupWizard } from './setupWizard';
import { WorkspaceMemoryService } from './workspaceMemoryService';

interface NotesQuickPickItem extends vscode.QuickPickItem {
    action: 'openExisting' | 'createNew';
    path: string;
}

let statusBarManager: StatusBarManager | undefined;
let backupManager: BackupManager | undefined;

export function activate(context: vscode.ExtensionContext): void {
    statusBarManager = new StatusBarManager();
    backupManager = new BackupManager(statusBarManager);

    const setupCommand = vscode.commands.registerCommand('autoscribe.setup', async () => {
        if (!backupManager) {
            return;
        }

        const knownWorkspaces = WorkspaceMemoryService.getKnownNotesWorkspaces(context);

        if (knownWorkspaces.length > 0) {
            const items: NotesQuickPickItem[] = knownWorkspaces.map(wPath => ({
                label: `$(folder) Open Notes: ${path.basename(wPath)}`,
                description: wPath,
                action: 'openExisting',
                path: wPath
            }));

            items.push({
                label: '$(plus) Create or Connect a New Notes Workspace',
                description: 'Setup a new folder and GitHub notes repository',
                action: 'createNew',
                path: ''
            });

            const selection = await vscode.window.showQuickPick(items, {
                placeHolder: 'AutoScribe: Open an existing notes workspace or create a new one'
            });

            if (!selection) {
                return;
            }

            if (selection.action === 'openExisting') {
                await vscode.commands.executeCommand(
                    'vscode.openFolder',
                    vscode.Uri.file(selection.path),
                    { forceNewWindow: true }
                );
                return;
            }
        }

        await SetupWizard.startWizard(backupManager.getGitService(), context, () => {
            backupManager?.reloadConfig();
        });
    });

    const syncNowCommand = vscode.commands.registerCommand('autoscribe.syncNow', async () => {
        if (backupManager) {
            await backupManager.triggerBackup(true);
        }
    });

    const toggleCommand = vscode.commands.registerCommand('autoscribe.toggle', async () => {
        if (backupManager) {
            const newState = await backupManager.toggleEnabled();
            const stateStr = newState ? 'enabled' : 'disabled';
            vscode.window.showInformationMessage(`AutoScribe auto-backup is now ${stateStr}.`);
        }
    });

    const configListener = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('autoscribe') && backupManager) {
            backupManager.reloadConfig();
        }
    });

    context.subscriptions.push(
        statusBarManager,
        backupManager,
        setupCommand,
        syncNowCommand,
        toggleCommand,
        configListener
    );
}

export function deactivate(): void {
    if (backupManager) {
        backupManager.dispose();
    }
    if (statusBarManager) {
        statusBarManager.dispose();
    }
}

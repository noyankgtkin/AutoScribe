import * as vscode from 'vscode';
import { GitHubService } from './githubService';
import { GitService } from './gitService';
import { WorkspaceSafetyService } from './workspaceSafetyService';
import { WorkspaceMemoryService } from './workspaceMemoryService';

export class SetupWizard {
    public static async startWizard(
        gitService: GitService,
        context: vscode.ExtensionContext,
        onComplete: () => void
    ): Promise<void> {
        const root = gitService.getWorkspaceRoot();
        const isCurrentNotesWorkspace = root ? WorkspaceSafetyService.isNotesWorkspace(root) : false;

        if (!root || !isCurrentNotesWorkspace) {
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: 'Select Notes Folder'
            });

            if (!folderUri || folderUri.length === 0) {
                return;
            }

            const targetPath = folderUri[0].fsPath;
            WorkspaceSafetyService.markAsNotesWorkspace(targetPath);
            WorkspaceMemoryService.addKnownNotesWorkspace(context, targetPath);

            await vscode.commands.executeCommand('vscode.openFolder', folderUri[0], { forceNewWindow: true });
            return;
        }

        const session = await GitHubService.getSession();
        if (!session) {
            vscode.window.showErrorMessage('GitHub authentication was not completed.');
            return;
        }

        const selection = await vscode.window.showQuickPick([
            {
                label: '$(plus) Create new private repository on GitHub',
                description: 'Create a private GitHub repo (e.g. autoscribe-notes) for automatic sync',
                action: 'create'
            },
            {
                label: '$(repo) Select an existing GitHub repository',
                description: 'Connect this folder to an existing GitHub repo in your account',
                action: 'existing'
            }
        ], {
            placeHolder: `Connected as ${session.account.label}. How would you like to setup your notes backup?`
        });

        if (!selection) {
            return;
        }

        let remoteUrl: string | undefined;

        if (selection.action === 'create') {
            const repoName = await vscode.window.showInputBox({
                prompt: 'Enter a name for your private GitHub notes repository',
                value: 'autoscribe-notes',
                validateInput: input => input.trim().length === 0 ? 'Repository name cannot be empty' : null
            });

            if (!repoName) {
                return;
            }

            const createdRepo = await GitHubService.createPrivateRepo(repoName.trim());
            if (!createdRepo) {
                return;
            }
            remoteUrl = createdRepo.cloneUrl;

        } else if (selection.action === 'existing') {
            vscode.window.showInformationMessage('Fetching your GitHub repositories...');
            const repos = await GitHubService.listUserRepos();

            if (repos.length === 0) {
                vscode.window.showWarningMessage('No repositories found in your GitHub account.');
                return;
            }

            const repoSelection = await vscode.window.showQuickPick(
                repos.map(r => ({
                    label: `$(repo) ${r.fullName}`,
                    description: r.private ? 'Private' : 'Public',
                    repo: r
                })),
                { placeHolder: 'Select a GitHub repository to connect' }
            );

            if (!repoSelection) {
                return;
            }
            remoteUrl = repoSelection.repo.cloneUrl;
        }

        if (!remoteUrl) {
            return;
        }

        WorkspaceSafetyService.markAsNotesWorkspace(root);
        WorkspaceMemoryService.addKnownNotesWorkspace(context, root);

        const initResult = await gitService.initializeRepo(remoteUrl);
        if (initResult.success) {
            vscode.window.showInformationMessage(`AutoScribe: ${initResult.message}`);
            onComplete();
        } else {
            vscode.window.showErrorMessage(`AutoScribe Setup Error: ${initResult.message}`);
        }
    }
}

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
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
        const session = await GitHubService.getSession();
        if (!session) {
            vscode.window.showErrorMessage('GitHub authentication was not completed.');
            return;
        }

        const selection = await vscode.window.showQuickPick([
            {
                label: '$(plus) Create new private notes repository & folder',
                description: 'Enter repo name, pick base location, and create folder automatically',
                action: 'create'
            },
            {
                label: '$(repo) Connect an existing GitHub repository',
                description: 'Select an existing GitHub repo and connect it to a local folder',
                action: 'existing'
            }
        ], {
            placeHolder: `Connected as ${session.account.label}. How would you like to setup your notes backup?`
        });

        if (!selection) {
            return;
        }

        if (selection.action === 'create') {
            await this.handleCreateFlow(context, onComplete);
        } else if (selection.action === 'existing') {
            await this.handleExistingFlow(context, onComplete);
        }
    }

    private static async handleCreateFlow(
        context: vscode.ExtensionContext,
        onComplete: () => void
    ): Promise<void> {
        const repoName = await vscode.window.showInputBox({
            prompt: 'Enter a name for your private GitHub notes repository',
            value: 'autoscribe-notes',
            validateInput: input => input.trim().length === 0 ? 'Repository name cannot be empty' : null
        });

        if (!repoName) {
            return;
        }

        const cleanRepoName = repoName.trim();

        const baseFolderUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: 'Select Base Directory for Notes Folder'
        });

        if (!baseFolderUri || baseFolderUri.length === 0) {
            return;
        }

        const parentPath = baseFolderUri[0].fsPath;
        const targetFolderPath = path.join(parentPath, cleanRepoName);

        try {
            if (!fs.existsSync(targetFolderPath)) {
                fs.mkdirSync(targetFolderPath, { recursive: true });
            }
        } catch (err: any) {
            vscode.window.showErrorMessage(`Failed to create local notes folder: ${err.message}`);
            return;
        }

        vscode.window.showInformationMessage(`Creating private GitHub repository '${cleanRepoName}'...`);
        const createdRepo = await GitHubService.createPrivateRepo(cleanRepoName);
        if (!createdRepo) {
            return;
        }

        WorkspaceSafetyService.markAsNotesWorkspace(targetFolderPath);
        WorkspaceMemoryService.addKnownNotesWorkspace(context, targetFolderPath);

        const targetGitService = new GitService(targetFolderPath);
        const initResult = await targetGitService.initializeRepo(createdRepo.cloneUrl);

        if (initResult.success) {
            vscode.window.showInformationMessage(`AutoScribe: ${initResult.message}`);
            onComplete();

            await vscode.commands.executeCommand(
                'vscode.openFolder',
                vscode.Uri.file(targetFolderPath),
                { forceNewWindow: true }
            );
        } else {
            vscode.window.showErrorMessage(`AutoScribe Setup Error: ${initResult.message}`);
        }
    }

    private static async handleExistingFlow(
        context: vscode.ExtensionContext,
        onComplete: () => void
    ): Promise<void> {
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

        const folderUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: 'Select Local Notes Folder to Connect'
        });

        if (!folderUri || folderUri.length === 0) {
            return;
        }

        const targetFolderPath = folderUri[0].fsPath;
        WorkspaceSafetyService.markAsNotesWorkspace(targetFolderPath);
        WorkspaceMemoryService.addKnownNotesWorkspace(context, targetFolderPath);

        const targetGitService = new GitService(targetFolderPath);
        const initResult = await targetGitService.initializeRepo(repoSelection.repo.cloneUrl);

        if (initResult.success) {
            vscode.window.showInformationMessage(`AutoScribe: ${initResult.message}`);
            onComplete();

            await vscode.commands.executeCommand(
                'vscode.openFolder',
                vscode.Uri.file(targetFolderPath),
                { forceNewWindow: true }
            );
        } else {
            vscode.window.showErrorMessage(`AutoScribe Setup Error: ${initResult.message}`);
        }
    }
}

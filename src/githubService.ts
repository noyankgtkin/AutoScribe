import * as vscode from 'vscode';

export interface GitHubRepoInfo {
    name: string;
    fullName: string;
    cloneUrl: string;
    sshUrl: string;
    private: boolean;
}

export class GitHubService {
    public static async getSession(): Promise<vscode.AuthenticationSession | undefined> {
        try {
            return await vscode.authentication.getSession('github', ['repo'], { createIfNone: true });
        } catch {
            return undefined;
        }
    }

    public static async createPrivateRepo(repoName: string): Promise<GitHubRepoInfo | undefined> {
        const session = await this.getSession();
        if (!session) {
            vscode.window.showErrorMessage('GitHub authentication is required to create a repository.');
            return undefined;
        }

        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'VSCode-AutoScribe-Extension'
            },
            body: JSON.stringify({
                name: repoName,
                private: true,
                description: 'Automated personal notes backup created by AutoScribe VS Code Extension',
                'auto_init': false
            })
        });

        if (!response.ok) {
            const errorData: any = await response.json().catch(() => ({}));
            const msg = errorData.message || response.statusText;
            vscode.window.showErrorMessage(`Failed to create GitHub repository: ${msg}`);
            return undefined;
        }

        const data: any = await response.json();
        return {
            name: data.name,
            fullName: data.full_name,
            cloneUrl: data.clone_url,
            sshUrl: data.ssh_url,
            private: data.private
        };
    }

    public static async listUserRepos(): Promise<GitHubRepoInfo[]> {
        const session = await this.getSession();
        if (!session) {
            return [];
        }

        try {
            const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'VSCode-AutoScribe-Extension'
                }
            });

            if (!response.ok) {
                return [];
            }

            const data = (await response.json()) as any[];
            return data.map(repo => ({
                name: repo.name,
                fullName: repo.full_name,
                cloneUrl: repo.clone_url,
                sshUrl: repo.ssh_url,
                private: repo.private
            }));
        } catch {
            return [];
        }
    }
}

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class WorkspaceSafetyService {
    public static readonly MARKER_FILENAME = '.autoscribe';

    public static isNotesWorkspace(workspaceRoot?: string): boolean {
        const root = workspaceRoot || this.getWorkspaceRoot();
        if (!root) {
            return false;
        }

        const markerPath = path.join(root, this.MARKER_FILENAME);
        if (fs.existsSync(markerPath)) {
            return true;
        }

        const vscodeMarkerPath = path.join(root, '.vscode', 'autoscribe.json');
        if (fs.existsSync(vscodeMarkerPath)) {
            return true;
        }

        const config = vscode.workspace.getConfiguration('autoscribe');
        return config.get<boolean>('isNotesWorkspace', false);
    }

    public static markAsNotesWorkspace(workspaceRoot?: string): boolean {
        const root = workspaceRoot || this.getWorkspaceRoot();
        if (!root) {
            return false;
        }

        try {
            const markerPath = path.join(root, this.MARKER_FILENAME);
            if (!fs.existsSync(markerPath)) {
                const content = JSON.stringify({
                    created: new Date().toISOString(),
                    version: '0.0.1',
                    description: 'AutoScribe Notes Workspace Marker - Protects non-notes repos from auto-backup'
                }, null, 2);
                fs.writeFileSync(markerPath, content, 'utf-8');
            }
            return true;
        } catch {
            return false;
        }
    }

    public static unmarkAsNotesWorkspace(workspaceRoot?: string): boolean {
        const root = workspaceRoot || this.getWorkspaceRoot();
        if (!root) {
            return false;
        }

        try {
            const markerPath = path.join(root, this.MARKER_FILENAME);
            if (fs.existsSync(markerPath)) {
                fs.unlinkSync(markerPath);
            }
            return true;
        } catch {
            return false;
        }
    }

    private static getWorkspaceRoot(): string | undefined {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return undefined;
        }
        return workspaceFolders[0].uri.fsPath;
    }
}

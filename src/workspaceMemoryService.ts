import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class WorkspaceMemoryService {
    private static readonly GLOBAL_STATE_KEY = 'autoscribe.knownNotesWorkspaces';

    public static getKnownNotesWorkspaces(context: vscode.ExtensionContext): string[] {
        const list = context.globalState.get<string[]>(this.GLOBAL_STATE_KEY, []);
        const validList = list.filter(folderPath => {
            try {
                return fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory();
            } catch {
                return false;
            }
        });

        if (validList.length !== list.length) {
            context.globalState.update(this.GLOBAL_STATE_KEY, validList);
        }

        return validList;
    }

    public static addKnownNotesWorkspace(context: vscode.ExtensionContext, folderPath: string): void {
        const normalized = path.normalize(folderPath);
        const currentList = this.getKnownNotesWorkspaces(context);

        if (!currentList.includes(normalized)) {
            currentList.push(normalized);
            context.globalState.update(this.GLOBAL_STATE_KEY, currentList);
        }
    }

    public static removeKnownNotesWorkspace(context: vscode.ExtensionContext, folderPath: string): void {
        const normalized = path.normalize(folderPath);
        const currentList = this.getKnownNotesWorkspaces(context);
        const updatedList = currentList.filter(p => p !== normalized);
        context.globalState.update(this.GLOBAL_STATE_KEY, updatedList);
    }
}

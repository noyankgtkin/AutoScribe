import * as vscode from 'vscode';

export type BackupMode = 'onSave' | 'interval' | 'both' | 'manual';
export type PushStrategy = 'onCommit' | 'interval' | 'manual';

export interface AutoScribeConfig {
    enabled: boolean;
    backupMode: BackupMode;
    intervalMinutes: number;
    gitAutoPush: boolean;
    pushStrategy: PushStrategy;
    pushIntervalMinutes: number;
    commitMessagePrefix: string;
    syncOnStartup: boolean;
}

export class ConfigManager {
    public static getConfig(): AutoScribeConfig {
        const config = vscode.workspace.getConfiguration('autoscribe');
        return {
            enabled: config.get<boolean>('enabled', true),
            backupMode: config.get<BackupMode>('backupMode', 'onSave'),
            intervalMinutes: Math.max(1, config.get<number>('intervalMinutes', 15)),
            gitAutoPush: config.get<boolean>('gitAutoPush', true),
            pushStrategy: config.get<PushStrategy>('pushStrategy', 'onCommit'),
            pushIntervalMinutes: Math.max(1, config.get<number>('pushIntervalMinutes', 15)),
            commitMessagePrefix: config.get<string>('commitMessagePrefix', 'AutoScribe Backup:'),
            syncOnStartup: config.get<boolean>('syncOnStartup', false)
        };
    }
}

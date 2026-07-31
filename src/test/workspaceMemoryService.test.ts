import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { WorkspaceMemoryService } from '../workspaceMemoryService';

class MockExtensionContext {
    private state: Record<string, any> = {};

    public globalState = {
        get: <T>(key: string, defaultValue?: T): T => {
            return (this.state[key] !== undefined ? this.state[key] : defaultValue) as T;
        },
        update: (key: string, value: any): Thenable<void> => {
            this.state[key] = value;
            return Promise.resolve();
        }
    };
}

suite('WorkspaceMemoryService Unit Tests', () => {
    test('addKnownNotesWorkspace adds valid folder to globalState memory', () => {
        const mockContext = new MockExtensionContext() as any;
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'autoscribe-mem-test-'));

        try {
            WorkspaceMemoryService.addKnownNotesWorkspace(mockContext, tempDir);
            const known = WorkspaceMemoryService.getKnownNotesWorkspaces(mockContext);

            assert.strictEqual(known.length, 1);
            assert.strictEqual(path.normalize(known[0]), path.normalize(tempDir));

            WorkspaceMemoryService.removeKnownNotesWorkspace(mockContext, tempDir);
            const updated = WorkspaceMemoryService.getKnownNotesWorkspaces(mockContext);
            assert.strictEqual(updated.length, 0);

        } finally {
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            } catch {
            }
        }
    });
});

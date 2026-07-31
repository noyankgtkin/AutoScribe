import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { WorkspaceSafetyService } from '../workspaceSafetyService';

suite('WorkspaceSafetyService Unit Tests', () => {
    test('isNotesWorkspace returns false for directory without .autoscribe marker', () => {
        const tempDir = os.tmpdir();
        const isNotes = WorkspaceSafetyService.isNotesWorkspace(tempDir);
        assert.strictEqual(isNotes, false);
    });

    test('markAsNotesWorkspace creates .autoscribe marker file', () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'autoscribe-safety-test-'));
        try {
            const marked = WorkspaceSafetyService.markAsNotesWorkspace(tempDir);
            assert.strictEqual(marked, true);

            const isNotes = WorkspaceSafetyService.isNotesWorkspace(tempDir);
            assert.strictEqual(isNotes, true);

            const unmarked = WorkspaceSafetyService.unmarkAsNotesWorkspace(tempDir);
            assert.strictEqual(unmarked, true);

            const isNotesAfterUnmark = WorkspaceSafetyService.isNotesWorkspace(tempDir);
            assert.strictEqual(isNotesAfterUnmark, false);
        } finally {
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            } catch {
            }
        }
    });
});

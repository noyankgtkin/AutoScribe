import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { GitService } from '../gitService';

suite('GitService Unit Tests', function () {
    this.timeout(10000);

    test('isGitRepo returns true for valid Git repository', async () => {
        const gitService = new GitService(process.cwd());
        const isRepo = await gitService.isGitRepo();
        assert.strictEqual(isRepo, true, 'Current workspace root should be detected as a Git repo');
    });

    test('isGitRepo returns false for non-git directory', async () => {
        const tempDir = os.tmpdir();
        const gitService = new GitService(tempDir);
        const isRepo = await gitService.isGitRepo();
        assert.strictEqual(isRepo, false, 'Temp directory should not be a Git repo');
    });

    test('performCommit fails gracefully for non-git directory', async () => {
        const tempDir = os.tmpdir();
        const gitService = new GitService(tempDir);
        const result = await gitService.performCommit('Test Prefix:');

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.committed, false);
        assert.strictEqual(result.message, 'Workspace is not a Git repository.');
    });

    test('performCommit handles clean repository and dirty repository in isolated temp directory', async () => {
        const tempRepoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'autoscribe-test-'));
        try {
            execSync('git init', { cwd: tempRepoDir });
            execSync('git config user.name "Test User"', { cwd: tempRepoDir });
            execSync('git config user.email "test@example.com"', { cwd: tempRepoDir });

            const gitService = new GitService(tempRepoDir);

            const cleanResult = await gitService.performCommit('Test Prefix:');
            assert.strictEqual(cleanResult.success, true);
            assert.strictEqual(cleanResult.committed, false);
            assert.strictEqual(cleanResult.message, 'No changes to commit.');

            const dummyFile = path.join(tempRepoDir, 'sample.txt');
            fs.writeFileSync(dummyFile, 'hello world', 'utf-8');

            const dirtyResult = await gitService.performCommit('Test Prefix:');
            assert.strictEqual(dirtyResult.success, true);
            assert.strictEqual(dirtyResult.committed, true);
            assert.strictEqual(dirtyResult.message, 'Backup committed locally.');
        } finally {
            try {
                fs.rmSync(tempRepoDir, { recursive: true, force: true });
            } catch {
            }
        }
    });
});

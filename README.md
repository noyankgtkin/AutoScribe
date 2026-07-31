# AutoScribe

**AutoScribe** is an automatic, zero-setup note backup extension for Visual Studio Code. It seamlessly connects your personal notes workspace to a private GitHub repository, automatically committing and pushing changes in the background without interrupting your workflow.

---

## 🌟 Key Features

- **Zero-Setup GitHub Onboarding:** Connect to your GitHub account using VS Code's native OAuth authentication and create a private notes repository in one click.
- **Company Project Protection:** AutoScribe is safely disabled by default on non-notes repositories (`AutoScribe: Ignored`). Your corporate and project source code is 100% protected.
- **Independent Window Workspace:** Opens notes workspaces in a brand new, isolated VS Code window (`forceNewWindow: true`) without disrupting your open project windows.
- **Flexible Backup Strategies:** Configure auto-backup on save, periodic timers, or manual execution.
- **Push Interval Controls:** Group commits locally and push to GitHub at customized intervals to minimize network overhead.

---

## ⚙️ Extension Settings

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `autoscribe.enabled` | `boolean` | `true` | Enable or disable AutoScribe automatic backup globally. |
| `autoscribe.backupMode` | `string` | `"onSave"` | Trigger mode: `"onSave"`, `"interval"`, `"both"`, or `"manual"`. |
| `autoscribe.intervalMinutes` | `number` | `15` | Backup interval in minutes when interval mode is active. |
| `autoscribe.gitAutoPush` | `boolean` | `true` | Automatically push committed changes to GitHub. |
| `autoscribe.pushStrategy` | `string` | `"interval"` | Push strategy: `"interval"`, `"onCommit"`, or `"manual"`. |
| `autoscribe.pushIntervalMinutes` | `number` | `15` | Interval in minutes between automatic GitHub pushes. |

---

## 🚀 Getting Started

1. Open VS Code and click **`$(wand) AutoScribe: Setup Notes`** in the status bar (bottom right).
2. Authenticate with GitHub when prompted.
3. Select or create your personal notes folder.
4. AutoScribe will automatically create your private GitHub repository and begin backing up your notes.

---

## 📄 License

MIT License.

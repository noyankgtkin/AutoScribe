# Change Log

All notable changes to the "AutoScribe" extension will be documented in this file.

## [0.0.1] - 2026-07-31

### Added
- **Zero-Setup GitHub Onboarding:** Built-in OAuth integration and automated private repository creation.
- **Company Project Protection:** Smart `.autoscribe` workspace detection that safely disables auto-backup on non-notes repositories (`AutoScribe: Ignored`).
- **Isolated Workspace Opening:** Automatically opens notes workspaces in a new, independent VS Code window (`forceNewWindow: true`).
- **Global Notes Memory:** Persistent memory of user's notes workspaces across VS Code sessions.
- **Flexible Backup & Push Modes:** Configurable backup triggers (`onSave`, `interval`, `both`, `manual`) and GitHub push interval controls.
- **Status Bar Indicator:** Live status updates, time of last backup, and clickable wizard controls.

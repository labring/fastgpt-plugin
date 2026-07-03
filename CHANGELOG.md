# Changelog

This file is the release-notes index for FastGPT Plugin.

## Unreleased

- CLI scaffolding now generates standalone plugin projects with published npm
  semver dependencies by default.
- CLI scaffolding keeps `--dependency-mode catalog` for official pnpm workspaces
  that define matching catalog entries.
- Generated plugin projects include `dev`, `debug`, `debug:run`, `check`, `build`,
  `test`, and `pack` scripts in the README path.
- CLI user-facing errors hide stack traces by default and show them with
  `--verbose`.

## v1.0.0 Infrastructure Upgrade

- See the [v1.0.0 Upgrade Guide](./docs/upgrade/v1.0.0.md) for production
  migration steps, compatibility notes, and the validation checklist.

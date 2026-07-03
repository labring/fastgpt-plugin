# {{name}}

{{description}}

## Quick Start

```bash
pnpm install
pnpm run dev
pnpm run debug
pnpm run debug:run
pnpm run build
pnpm run check
pnpm run test
pnpm run pack
```

`pnpm run dev` starts the remote FastGPT integration debug session with watch
mode enabled. Paste the FastGPT connection key when prompted, or pass one
directly:

```bash
fastgpt-plugin dev . --watch --connect '<connection-key-or-connect-link>'
```

`pnpm run debug` prints the plugin manifest, schema, and child-tool debug
commands. `pnpm run debug:run` executes the tool once with sample JSON input.
For tools with required input fields, replace the sample input:

```bash
npx @fastgpt-plugin/cli debug . --run{{debugRunToolOption}} --input '{{debugRunInput}}'
```

## Output

- `pnpm run build` writes `dist/index.js`, `dist/manifest.json`, copied logos,
  and optional static files.
- `pnpm run check` validates the build output before upload.
- `pnpm run pack` creates a `.pkg` file that can be uploaded to FastGPT Plugin.

## Dependency Mode

This project was generated with `{{dependencyMode}}` dependencies.

- `semver` uses published npm versions and works as a standalone plugin project.
- `catalog` is for pnpm workspace repositories that define matching catalog
  entries, such as the official plugin repository.

To generate a workspace-oriented project:

```bash
npx @fastgpt-plugin/cli create my-tool --type tool --dependency-mode catalog
```

## Troubleshooting

- Missing `index.ts`: run commands from the plugin project root, or pass
  `--entry <plugin-dir>`.
- Invalid JSON input: wrap input in a JSON object, for example `--input '{}'`.
- Need a stack trace: rerun the command with `--verbose`.

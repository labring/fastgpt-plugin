# DataForB2B — FastGPT System Tool

B2B data toolset for [FastGPT](https://github.com/labring/FastGPT): search and enrich people and
companies for lead generation, sales prospecting and recruiting — directly inside your FastGPT
workflows and agents.

Built for the [`labring/fastgpt-plugin`](https://github.com/labring/fastgpt-plugin) system-tool
format (`v0.6.x`: `modules/tool/packages/<tool>/`).

## Tools (endpoint mapping)

| Tool | Method + endpoint | Notes |
| --- | --- | --- |
| Search People | `POST /search/people` | up to 5 filter slots `{column, operator, value}` + advanced JSON; `count`/`offset`/`enrich_live` |
| Search Companies | `POST /search/companies` | same filter model |
| Reasoning Search | `POST /search/reasoning` | natural-language `query`, or `session_id` + `answers` to resolve a `needs_input` turn |
| Typeahead | `GET /typeahead` | resolves the exact stored value for a filter (`type`, `q`, `limit`) |
| Enrich Profile | `POST /enrich/profile` | `profile_identifier` + flags (`enrich_profile`/`work_email`/`personal_email`/`phone`/`github`); ≥1 flag |
| Enrich Company | `POST /enrich/company` | `{company_identifier}` |

## Authentication

Shared secret `apiKey` (sent as the `api_key` request header). Get a key from
[app.dataforb2b.ai](https://app.dataforb2b.ai) (Settings → API Keys). Base URL:
`https://api.dataforb2b.ai`.

## Build & test (inside the fastgpt-plugin monorepo)

1. Copy this folder to `modules/tool/packages/dataforb2b/` in a checkout of
   `labring/fastgpt-plugin` (branch `v0.6.x`).
2. From the repo root: `bun install`.
3. Build the tool: `cd modules/tool/packages/dataforb2b && bun run build`.
4. Run the dev server / tests as documented in the repo `dev.md` to verify the toolset loads and
   each tool invokes against a real API key.

## Publish

Open a pull request to [`labring/fastgpt-plugin`](https://github.com/labring/fastgpt-plugin)
adding `modules/tool/packages/dataforb2b/`. Use the `claude-dev-code` GitHub account (`authors` =
`claude-dev-code`). Bump the per-tool `versionList` value on every resubmission.

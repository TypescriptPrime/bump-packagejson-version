# Bump-packagejson-version (Bump package.json version from tag)

A simple GitHub Action that updates a package.json `version` field based on the release tag that triggered the workflow. This action validates that the tag is a valid Semantic Version (SemVer) and writes the cleaned version (for example, `v1.2.3` → `1.2.3`) into the selected `package.json` file.

The action is intended for workflows triggered by `release` events for stable releases and pre-releases.

---

## Key features

- Updates `version` in `package.json` with a SemVer-cleaned value derived from the Git tag.
- Validates inputs and paths using `Zod` and `fs` checks.
- Uses `@npmcli/package-json` to safely load and update `package.json`.
- Intentionally does not commit or push the changes automatically so you can control how updates are persisted.

---

## Input parameters

- `package-json-dir-path` (optional): The directory path where the `package.json` to update is located, relative to the repository root. If omitted or empty, the action updates the repository root `package.json`.

Example values:
- `''` (default) — `package.json` at the repository root
- `packages/my-package` — `package.json` inside `packages/my-package`

This action expects the following environment variables, which are typically wired in from your workflow:
- `TAG` (from `github.event.release.tag_name`)
- `WORKSPACE_PATH` (from `github.workspace`)

---

## Behavior and validation

- The action validates that the provided tag is a SemVer string using `semver` and `Zod`. If invalid, the action will fail.
- The action verifies the path that contains `package.json` and fails if the file is missing.
- The action loads the `package.json` using `@npmcli/package-json`, updates the `version` to a cleaned SemVer (uses `semver.clean`), and writes it back.
- This action does not automatically commit or push the resulting file changes. If you need those changes to be reflected in the repository, add a commit-and-push step to your workflow.

---

## Usage examples

### Basic release workflow (only stable releases)

```yml
name: Publish to npm
on:
  release:
    types: [published]

permissions:
      contents: read
      id-token: write

jobs:
  publish:
    name: Publish to npm
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 'lts/*'
      - name: Bump package.json version
        uses: TypescriptPrime/bump-packagejson-version@<version> # replace with actual version or commit hash for security
      - name: Install dependencies
        run: npm i
      - name: Build the project
        run: npm run build # use your actual build command
      - name: Publish package
        run: npm publish --access public # using npm's trusted publisher is recommended
```

### Advanced release workflow (stable releases and pre-releases)

```yml
name: Publish to npm
on:
  release:
    types: [published]

permissions:
      contents: read
      id-token: write

jobs:
  publish:
    name: Publish stable release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 'lts/*'
      - name: Bump package.json version
        uses: TypescriptPrime/bump-packagejson-version@<version> # replace with actual version or commit hash for security
      - name: Install dependencies
        run: npm i
      - name: Build the project
        run: npm run build # use your actual build command
      - name: Publish package
        run: npm publish --access public # using npm's trusted publisher is recommended
    if: ${{ !contains(github.event.release.tag_name, '-') }} # only for stable releases
  pre-release:
    name: Publish pre-release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 'lts/*'
      - name: Bump package.json version
        uses: TypescriptPrime/bump-packagejson-version@<version> # replace with actual version or commit hash for security
      - name: Install dependencies
        run: npm i
      - name: Build the project
        run: npm run build # use your actual build command
      - name: Publish pre-release package
        run: npm publish --tag prerelease --access public # using npm's trusted publisher is recommended and replace with actual tag
    if: ${{ contains(github.event.release.tag_name, '-') }} # only for pre-releases
```

---

## How it works

1. The workflow works correctly when releasing a release with a tag.
2. The action receives `TAG` and `WORKSPACE_PATH` from the workflow and runs `index.ts` with the appropriate arguments.
3. `index.ts` validates the tag and `package.json` path using `Zod` and `fs` checks.
4. The action loads the `package.json`, sets `version` to `semver.clean(tag)`, and writes the file back to disk.

---

## Troubleshooting

- `package-json-dir-path` incorrect or file not found: Confirm that the path you pass is the directory containing `package.json`, relative to the repo root.
- Invalid tag format: Ensure your tag matches SemVer (e.g., `v1.2.3` or `1.2.3`).
- Changes not visible in repo: Remember that the action modifies the file in the runner workspace but doesn't commit/push by default. Add a commit/push step if you want to persist it.
- Push permission errors: Use `persist-credentials: true` in `actions/checkout` and `GITHUB_TOKEN` or a suitable secret user token if pushing commits.

---

## License

This repository follows the `LICENSE` file included with the project.

---

## Notes

- This action is meant to be a simple automation to synchronize a package.json version to the release tag version. It is intentionally minimal to make it flexible for different CI flows.
- If you need automatic version bump commits and/or publishing to the registry, add additional workflow steps or a separate release step after committing the new version.

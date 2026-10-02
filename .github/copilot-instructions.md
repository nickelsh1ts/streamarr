# Streamarr Agent Workflow

Codebase architecture, commands, conventions, and gotchas are in the root `AGENTS.md`. This file covers how agents work in this repository.

## Working Agreement

- Start each new concern from the latest `origin/develop` on a narrowly named branch. Continue on an existing task branch for its review fixes and requested amendments; do not add unrelated work to the user's current branch.
- `develop` is the integration branch. Release PRs promote `develop` to `main`; semantic-release runs from `main` after that merge.
- Before switching branches, amending commits, or force-pushing, confirm the worktree is clean and re-read files reported as changed externally.
- Keep changes minimal and focused. Do not bundle adjacent cleanup, feature work, or generated churn into the same branch without asking first.
- Start from the smallest relevant code path. Gather only enough local context to form a falsifiable hypothesis and a focused validation check, then edit and validate before broadening scope.
- Prefer established project patterns and native behavior. Ask before replacing an existing approach when more than one valid design exists or the choice changes user-facing behavior, compatibility, security policy, release policy, or maintenance cost.
- Use `apply_patch` for manual file edits. Do not use shell commands to write files, and do not reformat unrelated content.
- The user normally opens PRs. Push a requested branch, but do not create a PR unless explicitly asked. When updating an existing PR, preserve the repository template and checklist unless the user requests a release-notes-only body.
- Do not create or modify a pull request, post or edit comments, reply to review feedback, resolve or close review threads, submit or dismiss reviews, change labels or metadata, or merge without explicit user approval for that specific action.
- Treat `.github/implementations/` as local scratch space for implementation notes. Keep only its `.gitkeep` in commits; do not add implementation documents to version control.
- Use short Conventional Commit subjects. `feat` creates a minor release; `fix`, `perf`, and `security` create a patch; a breaking change creates a major release. `build`, `ci`, `chore`, `docs`, `refactor`, `revert`, `style`, and `test` do not release by themselves. Use `security(scope): ...` for vulnerability fixes.
- After implementing and validating changes, stop and provide a concise diff/behavior/test summary for manual review. Ask for explicit approval before any commit, amend, or push; do not infer approval from the original implementation request.
- Do not commit, amend, push, create or modify branches, or perform any GitHub/PR action unless the user explicitly approves that specific action.
- Only amend/force-push after that explicit approval and when maintaining a single-commit branch already created in the current task. Always use `--force-with-lease`.
- Do not mark checklist items, publish releases, merge PRs, or change shared GitHub settings without explicit approval.

### Pause and Revalidate

Pause for confirmation before:

- expanding a fix beyond the reported behavior or opening another implementation branch;
- changing a public API contract, compatibility behavior, release/versioning policy, security guarantees, or data retention;
- replacing a project-wide pattern with a new abstraction, dependency, or workflow architecture;
- publishing an immutable release or accepting a known verification/security gap.

When the user questions a design choice, stop editing, answer the concern directly, and verify the assumption with code or runtime evidence before continuing.

### Validation and Reporting

- Validate the changed behavior, not only compilation. Prefer the narrowest executable check first, then typecheck/lint for the touched area.
- After the first substantive edit, run the narrowest focused validation before reading broadly or opening another implementation slice.
- Distinguish checks already run from manual checks still required. PR descriptions should list functional tests and preserve the standard checklist; omit generic command lists from the test narrative.
- Keep `Has This Been Tested?` proportional to the change. For documentation-only, configuration-only, or CI-only changes with no application functionality changed, use a concise statement such as `No functionality changed; documentation/configuration updates only.` Mention meaningful validation briefly if needed, but do not turn formatting, typechecking, or CI job names into a test checklist. For behavioral changes, use a checklist of concrete tests performed by the agent or developer and tests still required.
- In the standard PR checklist, check only applicable completed items. Leave non-applicable items unchecked without adding `not required`, `N/A`, or similar annotations.
- Never claim that a workflow, registry operation, OIDC signature, browser/PWA flow, or production migration is verified when it was only linted or simulated locally.
- Remove temporary scripts, test cache entries, containers, and dev servers created during validation.

### PR Review Workflow

- Read the current PR head, description, checks, and unresolved inline threads before editing. Review comments may refer to outdated code or a stale description; verify the claim instead of applying it blindly.
- Address comments with the smallest correct change. If declining a suggestion, explain the project-specific reason with concrete evidence.
- After manual review and explicit approval, commit/push the code change before replying. Reply with the commit/behavior that addresses the comment, then resolve the thread. A Copilot review summary can remain stale after its inline threads are resolved; use thread state as the actionable source.
- Keep PR descriptions aligned with the final implementation. Include tests already performed and concise functional checks still needed, and preserve the standard checklist unless the PR is specifically a release-notes PR.

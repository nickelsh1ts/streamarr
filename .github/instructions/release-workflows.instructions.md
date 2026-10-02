---
description: 'Use when editing GitHub Actions workflows, release automation, Docker image publishing, Cosign signing, SBOMs, Renovate action pins, or release PRs.'
applyTo: '.github/workflows/**'
---

# CI and Release Workflow Conventions

## General

- Pin third-party actions to full commit SHAs and keep the trailing version comment equal to a real upstream tag, including a leading `v` when present. Renovate uses that comment to resolve digest updates.
- Validate workflow edits with actionlint (for example, the pinned `rhysd/actionlint` container) and Prettier. Treat this as syntax/static validation, not proof that registry, OIDC, artifact, or release operations work.
- Keep job permissions minimal. Grant `id-token: write` only to jobs that request OIDC credentials, and keep verification jobs read-only when possible.
- Add explicit timeouts to jobs. Do not rely on hosted-runner defaults for required tools; use pinned setup actions for Buildx, Cosign, Trivy, Node, and pnpm.

## Docker Build and Publish

- Build amd64 and arm64 on native runners and push by digest. Transfer per-platform digests with short-lived artifacts, then create the multi-arch manifest in a publish job.
- Require the expected number of platform digests before publishing. Verify the final index contains both `linux/amd64` and `linux/arm64`.
- Pass final registry digests between jobs as separate raw `sha256:...` outputs. Construct fixed `repo@digest` references in consumer jobs. Do not combine full registry references into one job output: GitHub may suppress it as potentially secret.
- Publish immutable exact-version tags plus documented rolling tags. Signing and verification must use digests, never mutable tags.

## Signing, SBOM, and Verification

- Keep Publish, Sign, Verify, and Publish Release as separate jobs. Sign is the only stage that needs OIDC credentials; Build, Publish, and Sign require registry write access as appropriate. Publishing the GitHub release must depend on successful verification.
- Sign the multi-arch index and platform manifests. Generate one CycloneDX SBOM when both registries contain the same digest, attest it to both registry references, and attach it to the draft release before publication.
- Verify certificate identity against the exact workflow reference and GitHub OIDC issuer. Verify the index signature, SBOM attestation, and required platform signatures for each registry.
- A successful Publish job does not prove Sign ran. Empty loops can succeed; validate non-empty digest/image inputs before signing, scanning, attesting, or verifying.

## Release Operations

- `develop` is the integration branch; release PRs promote it to `main`, where semantic-release runs. Before promotion, calculate the highest pending release type: `feat` is minor; `fix`/`perf`/`security` are patch; a breaking change is major; non-releasing types do not lower a higher bump.
- GitHub reruns use the workflow revision from the original commit. A workflow fix merged later will not repair a failed historical run.
- Releases are created as drafts and published only after required assets and verification succeed. With immutable releases enabled, attach assets before publishing.
- Never manually publish a failed draft without stating which signatures, attestations, verification steps, or assets are missing and obtaining explicit approval.
- Release PR descriptions are release notes, not implementation instructions. Summarize included user-facing changes and security fixes; do not include the normal development checklist unless requested.

## Functional Validation

- For workflow changes, test shell fragments with representative values and inspect real prior run logs when available.
- Confirm registry tags and manifests with `docker buildx imagetools inspect`; confirm both registries resolve to the intended digest.
- Clearly label anything requiring a real GitHub Actions run: OIDC signing, cross-job output handling, registry writes, immutable release publication, and hosted-runner behavior.
- In PR descriptions, keep `Has This Been Tested?` proportional to the change. For workflow-only changes that do not alter application functionality, a concise statement such as `No application functionality changed; workflow updates only.` is preferable to a checklist of formatter, typecheck, or CI job results. For behavior-affecting workflow changes, list concrete local or agent-performed checks and remaining manual checks; do not turn GitHub Actions job status into the test checklist.
- In the standard PR checklist, check only applicable completed items. Leave non-applicable items unchecked without adding `not required`, `N/A`, or similar annotations.

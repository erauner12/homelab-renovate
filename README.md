# homelab-renovate

Centralized Renovate configuration for all homelab repositories.

## Overview

This repository contains the shared Renovate configuration used by the self-hosted Renovate CE deployment in [homelab-k8s](https://github.com/erauner12/homelab-k8s/tree/master/apps/renovate).

## Managed Repositories

| Repository | Description |
|------------|-------------|
| [homelab-k8s](https://github.com/erauner12/homelab-k8s) | Core Kubernetes GitOps repository |
| [homelab-smoke](https://github.com/erauner12/homelab-smoke) | Smoke test framework |
| [homelab-validation-image](https://github.com/erauner12/homelab-validation-image) | CI validation container |
| [homelab-go-utils](https://github.com/erauner12/homelab-go-utils) | Shared Go utilities |
| [homelab-jenkins-library](https://github.com/erauner12/homelab-jenkins-library) | Jenkins shared library |
| [homelab-shadow](https://github.com/erauner12/homelab-shadow) | Shadow deployment tool |
| [homelab-manifest-service](https://github.com/erauner12/homelab-manifest-service) | Manifest service for Backstage |
| [backstage-plugins](https://github.com/erauner12/backstage-plugins) | Backstage plugins |
| [omni](https://github.com/erauner12/omni) | Talos/Omni cluster config |
| [infrastructure](https://github.com/erauner12/infrastructure) | Terraform infrastructure |
| [dotfiles](https://github.com/erauner12/dotfiles) | Personal dotfiles |
| [taskfiles](https://github.com/erauner12/taskfiles) | Taskfile templates |
| [todoist-mcp](https://github.com/erauner12/todoist-mcp) | Todoist MCP server |
| [homelab-renovate](https://github.com/erauner12/homelab-renovate) | This repo (self-management) |

## Configuration Structure

```
homelab-renovate/
├── renovate.js              # Main JavaScript config (full programmatic control)
├── renovate.json            # Base config with schema and extends
├── pick-repos-to-renovate.js # Helper script to show selected repos
├── eslint.config.js         # ESLint flat config
├── .prettierrc              # Prettier config
├── package.json             # Dependencies and scripts
├── Jenkinsfile              # CI pipeline for validation
└── README.md                # This file
```

## Features

### Smart Repository Selection

The config includes intelligent repository selection to avoid timeouts and distribute load:

- **Shuffle + Slice**: On master branch, repos are shuffled and only ~50% are processed per run
- **PR Testing**: On PR branches, only `homelab-renovate` is processed for safe testing
- **Environment Overrides**: Force specific repos or all repos via environment variables

### Environment Variables for Control

| Variable | Description | Example |
|----------|-------------|---------|
| `RENOVATE_REPO` | Process only specific repos (comma-separated) | `erauner12/homelab-k8s,erauner12/omni` |
| `RENOVATE_ALL` | Process all repos (set to `true`) | `true` |
| `BRANCH_NAME` | Current branch (auto-set by Jenkins) | `master`, `feature/foo` |

### Centralized Management
- Single source of truth for Renovate config across all repos
- Consistent package rules and grouping
- Shared custom managers for non-standard files

### Custom Managers
- `versions.yaml` - Centralized version management in homelab-k8s
- `Jenkinsfile` - Docker image tags in pipeline files
- Talos configs - Machine config version tracking

### Package Grouping
- `homelab-components` - All decoupled homelab repos
- `kubernetes-ecosystem` - k8s, helm, kustomize tools
- `github-actions` - GitHub Actions updates
- `go-dependencies` - Go module updates

### Private Registry Support
- Nexus Docker proxy (`docker.nexus.erauner.dev`)
- Nexus NPM proxy (`npm.nexus.erauner.dev`)
- Nexus PyPI proxy (`pypi.nexus.erauner.dev`)
- Athens Go proxy (`athens.erauner.dev`)

## Usage

### Adding a New Repository

1. Add the repo to the `allRepositories` array in `renovate.js`:
   ```javascript
   const allRepositories = [
     // ... existing repos
     'erauner12/new-repo',
   ];
   ```

2. Commit and push - Renovate will onboard the repo automatically.

### Local Validation

```bash
# Install dependencies
npm ci

# Check JavaScript syntax
npm run validate

# Lint the config
npm run lint

# Fix lint issues
npm run lint:fix

# Check formatting
npm run format:check

# Fix formatting
npm run format

# Show which repos will be processed
npm run pick-repos

# Test with specific repo
RENOVATE_REPO=erauner12/homelab-k8s npm run pick-repos

# Test with all repos
RENOVATE_ALL=true npm run pick-repos
```

### Testing Changes Safely

PRs to this repo only test against `homelab-renovate` itself, not all managed repos. This prevents accidental changes from affecting production repositories.

To test against a specific repo:
```bash
RENOVATE_REPO=erauner12/my-test-repo npm run pick-repos
```

### Environment Variables

The Renovate deployment requires these environment variables:

| Variable | Description |
|----------|-------------|
| `MEND_RNV_GITHUB_APP_ID` | GitHub App ID |
| `MEND_RNV_GITHUB_APP_KEY` | GitHub App private key |
| `RENOVATE_WEBHOOK_SECRET` | Webhook secret for real-time updates |
| `NEXUS_USERNAME` | Nexus registry username (optional) |
| `NEXUS_PASSWORD` | Nexus registry password (optional) |
| `LOG_LEVEL` | Logging level (info/debug/trace) |

## Deployment

This config is consumed by the Renovate CE deployment in homelab-k8s:

- **Deployment**: `apps/renovate/`
- **Image**: `ghcr.io/mend/renovate-ce`
- **Webhook URL**: `https://renovate.erauner.dev/webhook`

The ConfigMap in homelab-k8s references this config or can be updated to fetch it directly.

## CI Pipeline

The Jenkinsfile validates:
1. JavaScript syntax for `renovate.js`
2. JSON syntax for `renovate.json`
3. Required fields presence
4. ESLint rules
5. Prettier formatting
6. Repository selection output

## Related

- [homelab-k8s/apps/renovate](https://github.com/erauner12/homelab-k8s/tree/master/apps/renovate) - Renovate deployment
- [homelab-k8s/versions.yaml](https://github.com/erauner12/homelab-k8s/blob/master/versions.yaml) - Centralized version management
- [Renovate Documentation](https://docs.renovatebot.com/)

/**
 * Centralized Renovate configuration for all homelab repositories.
 *
 * This config is used by the self-hosted Renovate CE deployment in homelab-k8s.
 * See: https://github.com/erauner12/homelab-k8s/tree/master/apps/renovate
 */

/**
 * All repositories managed by this Renovate instance.
 * Add new repos here to have them automatically onboarded.
 */
const repositories = [
  // Core infrastructure
  'erauner12/homelab-k8s',
  'erauner12/omni',
  'erauner12/infrastructure',

  // Decoupled components (from homelab-k8s)
  'erauner12/homelab-smoke',
  'erauner12/homelab-validation-image',
  'erauner12/homelab-go-utils',
  'erauner12/backstage-plugins',

  // Tools and utilities
  'erauner12/dotfiles',
  'erauner12/taskfiles',
  'erauner12/todoist-mcp',

  // This repo (self-management)
  'erauner12/homelab-renovate',
];

/**
 * Host rules for private registries.
 * Credentials are provided via environment variables in the Renovate deployment.
 */
const hostRules = [
  {
    // Nexus Docker proxy
    matchHost: 'docker.nexus.erauner.dev',
    hostType: 'docker',
    username: process.env.NEXUS_USERNAME,
    password: process.env.NEXUS_PASSWORD,
  },
  {
    // Nexus NPM proxy
    matchHost: 'npm.nexus.erauner.dev',
    hostType: 'npm',
    username: process.env.NEXUS_USERNAME,
    password: process.env.NEXUS_PASSWORD,
  },
  {
    // Nexus PyPI proxy
    matchHost: 'pypi.nexus.erauner.dev',
    hostType: 'pypi',
    username: process.env.NEXUS_USERNAME,
    password: process.env.NEXUS_PASSWORD,
  },
  {
    // Nexus Go proxy (Athens)
    matchHost: 'athens.erauner.dev',
    hostType: 'go',
  },
  {
    // Nexus Helm proxy
    matchHost: 'helm.nexus.erauner.dev',
    hostType: 'helm',
    username: process.env.NEXUS_USERNAME,
    password: process.env.NEXUS_PASSWORD,
  },
];

/**
 * Package rules for grouping and automerge behavior.
 */
const packageRules = [
  // Group all homelab decoupled components
  {
    description: 'Group homelab decoupled components',
    matchPackagePatterns: ['^erauner12/homelab-'],
    groupName: 'homelab-components',
    automerge: false, // Require review for internal components
  },

  // Automerge patch updates for stable dependencies
  {
    description: 'Automerge patch updates',
    matchUpdateTypes: ['patch'],
    matchCurrentVersion: '!/^0/',
    automerge: true,
    automergeType: 'pr',
  },

  // Group Kubernetes-related updates
  {
    description: 'Group Kubernetes ecosystem',
    matchPackagePatterns: [
      '^kubernetes',
      '^k8s',
      '^kubectl',
      '^helm',
      '^kustomize',
    ],
    groupName: 'kubernetes-ecosystem',
  },

  // Group GitHub Actions
  {
    description: 'Group GitHub Actions',
    matchManagers: ['github-actions'],
    groupName: 'github-actions',
    automerge: true,
  },

  // Group Docker base images
  {
    description: 'Group Docker base images',
    matchDatasources: ['docker'],
    matchPackagePatterns: ['^ghcr.io/', '^docker.io/'],
    groupName: 'docker-images',
  },

  // Group Go dependencies
  {
    description: 'Group Go dependencies',
    matchManagers: ['gomod'],
    groupName: 'go-dependencies',
  },

  // Security updates - no grouping, immediate
  {
    description: 'Security updates - immediate',
    matchUpdateTypes: ['pin', 'digest'],
    groupName: null,
    automerge: true,
  },
];

/**
 * Custom managers for non-standard version files.
 */
const customManagers = [
  // versions.yaml in homelab-k8s
  {
    customType: 'regex',
    description: 'Update docker image tags in versions.yaml',
    fileMatch: ['^versions\\.yaml$'],
    matchStrings: [
      '#\\s*renovate:\\s*datasource=(?<datasource>[^\\s]+)\\s+depName=(?<depName>[^\\s]+)(?:\\s+(?<additionalConfig>[^\\n]*))?\\n\\s*\\w+:\\n\\s*repository:[^\\n]+\\n\\s*tag:\\s*(?<currentValue>[^\\s]+)',
    ],
  },
  {
    customType: 'regex',
    description: 'Update module versions in versions.yaml',
    fileMatch: ['^versions\\.yaml$'],
    matchStrings: [
      '#\\s*renovate:\\s*datasource=(?<datasource>[^\\s]+)\\s+depName=(?<depName>[^\\s]+)(?:\\s+versioning=(?<versioning>[^\\s]+))?\\n\\s*[\\w-]+:\\s*(?<currentValue>(?:pkg/)?v?[0-9][^\\s]*)',
    ],
  },
  {
    customType: 'regex',
    description: 'Update CLI tool versions in versions.yaml',
    fileMatch: ['^versions\\.yaml$'],
    matchStrings: [
      '#\\s*renovate:\\s*datasource=(?<datasource>[^\\s]+)\\s+depName=(?<depName>[^\\s]+)(?:\\s+extractVersion=(?<extractVersion>[^\\n]+))?\\n\\s*[\\w-]+:\\s*(?<currentValue>v[0-9][^\\s]*)',
    ],
  },
  // Jenkinsfile image tags
  {
    customType: 'regex',
    description: 'Update Jenkinsfile image tags',
    fileMatch: ['^Jenkinsfile', 'Jenkinsfile$'],
    matchStrings: [
      "image ['\"](?<depName>[^:'\"]+):(?<currentValue>[^'\"]+)['\"]",
    ],
    datasourceTemplate: 'docker',
  },
  // Talos machine config versions
  {
    customType: 'regex',
    description: 'Update Talos versions in omni configs',
    fileMatch: ['\\.yaml$'],
    matchStrings: [
      'talos\\.dev/version:\\s*(?<currentValue>v[0-9.]+)',
    ],
    depNameTemplate: 'siderolabs/talos',
    datasourceTemplate: 'github-releases',
  },
];

module.exports = {
  // Platform configuration
  platform: 'github',
  endpoint: 'https://api.github.com/',

  // Repository list
  repositories,

  // Disable autodiscovery - use explicit repo list
  autodiscover: false,
  onboarding: true,
  onboardingConfig: {
    $schema: 'https://docs.renovatebot.com/renovate-schema.json',
    extends: ['config:recommended', ':semanticCommits'],
  },
  requireConfig: 'optional',

  // Scheduling
  timezone: 'America/Chicago',
  schedule: ['at any time'], // Webhook-driven, run anytime

  // PR behavior
  prConcurrentLimit: 10,
  branchConcurrentLimit: 15,
  prHourlyLimit: 0, // No hourly limit

  // Stability
  stabilityDays: 1, // Wait 1 day for non-security updates
  minimumReleaseAge: '1 day',

  // Commit style
  semanticCommits: 'enabled',
  commitMessagePrefix: 'chore(deps):',

  // Dashboard
  dependencyDashboard: true,
  dependencyDashboardTitle: '🤖 Renovate Dashboard',
  dependencyDashboardHeader:
    'This issue tracks all Renovate updates for this repository.',
  dependencyDashboardFooter:
    'Managed by [homelab-renovate](https://github.com/erauner12/homelab-renovate)',

  // Enabled managers
  enabledManagers: [
    'dockerfile',
    'docker-compose',
    'github-actions',
    'gomod',
    'helm-values',
    'kubernetes',
    'kustomize',
    'npm',
    'pip_requirements',
    'regex',
  ],

  // Host rules for private registries
  hostRules,

  // Package rules
  packageRules,

  // Custom managers
  customManagers,

  // Post-upgrade tasks for homelab-k8s
  postUpgradeTasks: {
    commands: ['./scripts/sync-versions.sh || true'],
    fileFilters: ['**/*'],
    executionMode: 'branch',
  },

  // Webhook configuration (for Renovate CE server mode)
  webhookSecret: process.env.RENOVATE_WEBHOOK_SECRET,

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

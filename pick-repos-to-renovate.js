#!/usr/bin/env node
/**
 * Helper script to show which repos will be processed by Renovate.
 * Used in Jenkinsfile to provide visibility into the current run.
 *
 * Environment Variables:
 *   RENOVATE_REPO   - Comma-separated list of repos to process (override)
 *   RENOVATE_ALL    - Set to 'true' to process all repos
 *   BRANCH_NAME     - Current branch (master/main = subset, other = test repo only)
 *
 * Usage:
 *   node pick-repos-to-renovate.js          # Show repos for current context
 *   RENOVATE_REPO=erauner12/foo node ...    # Override with specific repo
 *   RENOVATE_ALL=true node ...              # Force all repos
 */

const config = require('./renovate.js');

console.log('');
console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║              Homelab Renovate - Repository Selection              ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝');
console.log('');

// Show environment context
console.log('Environment:');
console.log(`  BRANCH_NAME:    ${process.env.BRANCH_NAME || '(not set, defaulting to master)'}`);
console.log(`  RENOVATE_REPO:  ${process.env.RENOVATE_REPO || '(not set)'}`);
console.log(`  RENOVATE_ALL:   ${process.env.RENOVATE_ALL || '(not set)'}`);
console.log('');

// Show selection results
const selected = config.repositories;
const total = config.allRepositories.length;

console.log(`Selected ${selected.length} of ${total} total repositories:`);
console.log('');

selected.forEach((repo, index) => {
  console.log(`  ${String(index + 1).padStart(2)}. ${repo}`);
});

console.log('');

// Show what's NOT being processed this run (if subset)
if (selected.length < total) {
  const notSelected = config.allRepositories.filter(r => !selected.includes(r));
  console.log(`Skipped this run (${notSelected.length} repos):`);
  notSelected.forEach(repo => {
    console.log(`      - ${repo}`);
  });
  console.log('');
  console.log('💡 Tip: Set RENOVATE_ALL=true to process all repos');
  console.log('💡 Tip: Set RENOVATE_REPO=owner/repo to target specific repos');
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════════════');

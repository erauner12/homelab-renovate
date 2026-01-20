#!/usr/bin/env groovy

@Library('homelab@main') _

// Inline pod template for Node.js validation
def POD_YAML = '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    workload-type: ci-validation
spec:
  containers:
  - name: jnlp
    image: jenkins/inbound-agent:3355.v388858a_47b_33-3-jdk21
    resources:
      requests:
        cpu: 100m
        memory: 256Mi
      limits:
        cpu: 500m
        memory: 512Mi
  - name: node
    image: node:22-alpine
    command: ['sleep', '3600']
    resources:
      requests:
        cpu: 100m
        memory: 256Mi
      limits:
        cpu: 500m
        memory: 512Mi
'''

pipeline {
    agent {
        kubernetes {
            yaml POD_YAML
        }
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        skipDefaultCheckout(true)
        timeout(time: 10, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        BRANCH_NAME = "${env.BRANCH_NAME ?: 'master'}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                container('node') {
                    sh '''
                        echo "=== Installing npm dependencies ==="
                        npm ci --ignore-scripts
                    '''
                }
            }
        }

        stage('Validate Config') {
            steps {
                container('node') {
                    sh '''
                        echo "=== Validating renovate.js syntax ==="
                        node -c renovate.js
                        echo "✓ JavaScript syntax valid"

                        echo ""
                        echo "=== Validating renovate.json syntax ==="
                        cat renovate.json | jq . > /dev/null || {
                            echo "jq not available, using node for JSON validation"
                            node -e "JSON.parse(require('fs').readFileSync('renovate.json'))"
                        }
                        echo "✓ JSON syntax valid"

                        echo ""
                        echo "=== Checking for required fields ==="
                        node -e "
                            const config = require('./renovate.js');
                            const required = ['platform', 'repositories', 'packageRules'];
                            const missing = required.filter(f => !config[f]);
                            if (missing.length > 0) {
                                console.error('Missing required fields:', missing.join(', '));
                                process.exit(1);
                            }
                            console.log('✓ All required fields present');
                            console.log('  - Platform:', config.platform);
                            console.log('  - Repositories:', config.repositories.length);
                            console.log('  - All Repositories:', config.allRepositories.length);
                            console.log('  - Package Rules:', config.packageRules.length);
                        "
                    '''
                }
            }
        }

        stage('Lint') {
            steps {
                container('node') {
                    sh '''
                        echo "=== Running ESLint ==="
                        npm run lint || echo "⚠️ Lint warnings (non-blocking)"

                        echo ""
                        echo "=== Checking Prettier formatting ==="
                        npm run format:check || echo "⚠️ Format warnings (non-blocking)"
                    '''
                }
            }
        }

        stage('Show Repository Selection') {
            steps {
                container('node') {
                    sh '''
                        echo "=== Repository Selection for this Run ==="
                        node pick-repos-to-renovate.js
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '✅ Renovate configuration is valid!'
        }
        failure {
            echo '❌ Renovate configuration validation failed!'
        }
    }
}

#!/usr/bin/env groovy

@Library('homelab@main') _

pipeline {
    agent {
        kubernetes {
            inheritFrom 'validation'
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
                container('validation') {
                    sh '''
                        echo "=== Installing npm dependencies ==="
                        npm ci --ignore-scripts
                    '''
                }
            }
        }

        stage('Validate Config') {
            steps {
                container('validation') {
                    sh '''
                        echo "=== Validating renovate.js syntax ==="
                        node -c renovate.js
                        echo "✓ JavaScript syntax valid"

                        echo ""
                        echo "=== Validating renovate.json syntax ==="
                        cat renovate.json | jq . > /dev/null
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
                container('validation') {
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
                container('validation') {
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

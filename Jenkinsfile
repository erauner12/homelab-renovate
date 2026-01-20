#!/usr/bin/env groovy

@Library('homelab-jenkins-library@main') _

pipeline {
    agent {
        kubernetes {
            inheritFrom 'validation'
        }
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        skipDefaultCheckout(true)
        ansiColor('xterm')
        timestamps()
        timeout(time: 10, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
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
                            console.log('  - Package Rules:', config.packageRules.length);
                        "
                    '''
                }
            }
        }

        stage('List Managed Repos') {
            steps {
                container('validation') {
                    sh '''
                        echo "=== Managed Repositories ==="
                        node -e "
                            const config = require('./renovate.js');
                            console.log('');
                            config.repositories.forEach((repo, i) => {
                                console.log('  ' + (i+1) + '. ' + repo);
                            });
                            console.log('');
                            console.log('Total: ' + config.repositories.length + ' repositories');
                        "
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

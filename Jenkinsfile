pipeline {
    agent {
        node {
            customWorkspace 'C:\\jenkins-fixed\\my-app'
        }
    }

    options {
        disableConcurrentBuilds()
        skipDefaultCheckout()
    }

    environment {
        ROOT_DIR     = 'C:\\jenkins-fixed\\my-app'
        FRONTEND_DIR = 'C:\\jenkins-fixed\\my-app\\frontend'
        BACKEND_DIR  = 'C:\\jenkins-fixed\\my-app'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check tools') {
            steps {
                bat '''
                where git
                where node
                where npm
                where python

                node -v
                npm -v
                python --version
                '''
            }
        }

        stage('Check frontend node_modules') {
            steps {
                bat '''
                if not exist "%FRONTEND_DIR%\\node_modules" (
                    echo frontend\\node_modules not found
                    exit /b 1
                )
                '''
            }
        }

        stage('Build frontend') {
            steps {
                dir('frontend') {
                    bat '''
                    call npm run build
                    '''
                }
            }
        }

        stage('Stop old processes') {
            steps {
                bat '''
                echo Checking port 3000...
                for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
                    taskkill /PID %%a /F >nul 2>&1
                )

                echo Checking port 5000...
                for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
                    taskkill /PID %%a /F >nul 2>&1
                )
                '''
            }
        }

        stage('Start frontend') {
            steps {
                dir('frontend') {
                    bat '''
                    start "frontend" /MIN cmd /c "cd /d %FRONTEND_DIR% && call npm start > frontend.log 2>&1"
                    '''
                }
            }
        }

        stage('Start backend') {
            steps {
                bat '''
                start "backend" /MIN cmd /c "cd /d %BACKEND_DIR% && python run.py > backend.log 2>&1"
                '''
            }
        }
    }

    post {
        always {
            bat '''
            echo ===== FRONTEND LOG (tail) =====
            if exist "%FRONTEND_DIR%\\frontend.log" powershell -Command "Get-Content '%FRONTEND_DIR%\\frontend.log' -Tail 30"

            echo ===== BACKEND LOG (tail) =====
            if exist "%BACKEND_DIR%\\backend.log" powershell -Command "Get-Content '%BACKEND_DIR%\\backend.log' -Tail 30"
            '''
        }
    }
}
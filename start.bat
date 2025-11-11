@echo off
echo ========================================
echo Smart Traffic IoT - Backend Server
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please create .env file with required variables.
    echo See .env.example for reference.
    pause
    exit /b 1
)

echo Starting server in development mode...
echo.
echo Server will be available at: http://localhost:5000
echo API Documentation: http://localhost:5000/api/test/health
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev

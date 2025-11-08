@echo off
REM Start Backend (Chatbot) and Frontend - Windows Version

echo ================================
echo   Start Backend ^& Frontend
echo ================================
echo.

set CHATBOT_PORT=3001
set FRONTEND_PORT=5173

echo Step 1: Starting Chatbot Backend
echo =================================

cd /d "%~dp0\..\1"

if not exist ".env" (
    if exist ".env.example" (
        echo Creating .env from .env.example...
        copy .env.example .env
        echo [OK] Created .env
        echo Please edit .env and add your API keys
        pause
    ) else (
        echo Error: .env.example not found
        pause
        exit /b 1
    )
) else (
    echo [OK] Found .env file
)

if not exist "node_modules" (
    echo Installing chatbot dependencies...
    npm install
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)

echo Starting chatbot server on port %CHATBOT_PORT%...
start "Chatbot Server" /min cmd /c "npm start > ..\chatbot-server.log 2>&1"

timeout /t 5 /nobreak >nul
echo [OK] Chatbot server started

echo.
echo Step 2: Starting React Frontend
echo ================================

cd /d "%~dp0\..\snap-map"

if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)

echo Starting frontend server on port %FRONTEND_PORT%...
start "Frontend Server" /min cmd /c "npm run dev > ..\frontend-server.log 2>&1"

timeout /t 5 /nobreak >nul
echo [OK] Frontend server started

echo.
echo Step 3: Opening Browser
echo =======================

timeout /t 2 /nobreak >nul
start http://localhost:%FRONTEND_PORT%

echo [OK] Browser opened

echo.
echo ================================
echo   Servers are now running!
echo ================================
echo.
echo Access URLs:
echo   Frontend:    http://localhost:%FRONTEND_PORT%
echo   Backend API: http://localhost:%CHATBOT_PORT%
echo   Health:      http://localhost:%CHATBOT_PORT%/health
echo.
echo Logs:
echo   Chatbot:  chatbot-server.log
echo   Frontend: frontend-server.log
echo.
echo To stop servers:
echo   - Close the "Chatbot Server" window
echo   - Close the "Frontend Server" window
echo   Or press Ctrl+C in this window
echo.
pause

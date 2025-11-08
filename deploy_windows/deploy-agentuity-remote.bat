@echo off
REM Deploy Agentuity to Remote (Agentuity Cloud) - Windows Version

REM Add Bun to PATH for this session
set PATH=%PATH%;C:\Users\Sean\.bun\bin

echo ================================
echo   Deploy Agentuity to Remote
echo ================================
echo.

cd /d "%~dp0\..\snapagent"

echo Checking Agentuity CLI...
where agentuity >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Agentuity CLI not found. Installing...
    npm install -g @agentuity/cli
    echo [OK] Agentuity CLI installed
) else (
    echo [OK] Agentuity CLI found
)

echo.
echo Checking login status...
agentuity whoami >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Not logged in. Let's login...
    agentuity login
) else (
    echo [OK] Already logged in
)

echo.
echo Installing dependencies...
if not exist "node_modules" (
    npm install
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)

echo.
echo Building project...
agentuity build
echo [OK] Build complete

echo.
echo Deploying to Agentuity Cloud...
echo This may take a few minutes...
agentuity deploy

echo.
echo [OK] Deployment complete!

echo.
echo Getting deployment status...
agentuity status

echo.
echo ================================
echo   Deployment Successful!
echo ================================
echo.
echo Next Steps:
echo 1. Update your .env file in the "1" folder
echo 2. Set: AGENTUITY_URL=^<your-deployment-url^>
echo 3. Run: deploy_windows\start-backend-frontend.bat
echo.
echo Useful Commands:
echo   View logs:        agentuity logs
echo   Check status:     agentuity status
echo   Redeploy:         agentuity deploy
echo.
pause

# Windows Deployment Scripts

Batch scripts for deploying and running SnapMap on Windows.

## 📁 Scripts

| Script | Purpose |
|--------|---------|
| `deploy-agentuity-remote.bat` | Deploy Agentuity to cloud with `agentuity deploy` |
| `start-backend-frontend.bat` | Start chatbot + frontend together |

---

## 🚀 Quick Start

### 1. Deploy Agentuity to Cloud

Double-click:
```
deploy_windows\deploy-agentuity-remote.bat
```

Or from PowerShell/CMD:
```powershell
.\deploy_windows\deploy-agentuity-remote.bat
```

### 2. Configure Environment

Edit `1\.env`:
```
AGENTUITY_URL=https://your-project.agentuity.cloud
ANTHROPIC_API_KEY=your_api_key_here
```

### 3. Start Application

Double-click:
```
deploy_windows\start-backend-frontend.bat
```

Or from PowerShell/CMD:
```powershell
.\deploy_windows\start-backend-frontend.bat
```

---

## 📝 Script Details

### `deploy-agentuity-remote.bat`

**Deploy Agentuity to Agentuity Cloud**

What it does:
1. Checks/installs Agentuity CLI
2. Logs you into Agentuity
3. Installs dependencies
4. Builds the project
5. Deploys to cloud
6. Shows deployment URL

---

### `start-backend-frontend.bat`

**Start chatbot and frontend servers**

What it does:
1. Starts chatbot server (port 3001)
2. Starts frontend server (port 5173)
3. Opens browser automatically
4. Creates separate windows for each server

**To stop:**
- Close the "Chatbot Server" window
- Close the "Frontend Server" window

---

## 🔍 Viewing Logs

Logs are created in the project root:

```powershell
# View chatbot logs
type ..\chatbot-server.log

# View frontend logs
type ..\frontend-server.log

# Follow logs (with PowerShell)
Get-Content ..\chatbot-server.log -Wait
Get-Content ..\frontend-server.log -Wait
```

---

## 🎯 Recommended Workflow

### First Time Setup

1. **Deploy Agentuity:**
   ```
   deploy_windows\deploy-agentuity-remote.bat
   ```

2. **Configure `.env`:**
   - Open `1\.env` in Notepad
   - Set `AGENTUITY_URL` from deployment output
   - Set `ANTHROPIC_API_KEY`
   - Save and close

3. **Start application:**
   ```
   deploy_windows\start-backend-frontend.bat
   ```

### Daily Development

Just run:
```
deploy_windows\start-backend-frontend.bat
```

---

## 🔧 Environment Variables

Set before running scripts:

```powershell
# PowerShell
$env:CHATBOT_PORT=4000
$env:FRONTEND_PORT=8080
.\deploy_windows\start-backend-frontend.bat
```

```cmd
REM CMD
set CHATBOT_PORT=4000
set FRONTEND_PORT=8080
deploy_windows\start-backend-frontend.bat
```

---

## 🐛 Troubleshooting

### "npm not found"

Install Node.js from: https://nodejs.org/

### "agentuity not found"

The script will install it automatically. If it fails:
```powershell
npm install -g @agentuity/cli
```

### "Port already in use"

Kill processes:
```powershell
# PowerShell
Get-Process -Name node | Stop-Process -Force

# Or manually find and kill
netstat -ano | findstr :3001
taskkill /PID <pid> /F
```

### "Can't connect to Agentuity"

Check `.env` file:
```powershell
type 1\.env | findstr AGENTUITY_URL
```

Test connection:
```powershell
curl https://your-project.agentuity.cloud
```

---

## 💡 Tips

### Run in Background

Use PowerShell to run without blocking:

```powershell
Start-Process powershell -ArgumentList "-File .\deploy_windows\start-backend-frontend.bat"
```

### Check if Servers are Running

```powershell
# Check if chatbot is running
curl http://localhost:3001/health

# Check if frontend is running
curl http://localhost:5173
```

### Stop Servers

Close the popup windows or:

```powershell
# Stop all Node.js processes (careful!)
Get-Process -Name node | Stop-Process -Force
```

---

## 📚 Documentation

- [Main Deployment Guide](../DEPLOYMENT.md)
- [Agentuity Cloud Deployment](../AGENTUITY_DEPLOYMENT.md)
- [Quick Start Guide](../REMOTE_SETUP_QUICKSTART.md)

---

## 🔄 Updating Agentuity

When you make changes to your agents:

```
deploy_windows\deploy-agentuity-remote.bat
```

No need to restart chatbot/frontend - they connect to the updated cloud deployment automatically.

---

## 🆘 Getting Help

1. Check logs: `type ..\*-server.log`
2. Read docs: See links above
3. Create GitHub issue with error logs

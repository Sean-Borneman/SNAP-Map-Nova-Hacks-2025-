# Quick Start Guide - Starting SnapMap Servers

Choose your operating system below.

---

## 🍎 macOS / Linux

### Start Everything (Remote Agentuity + Local Servers)

**Most common for daily development:**

```bash
./deploy_mac/start-backend-frontend.sh
```

Starts chatbot + frontend, connects to remote Agentuity.

---

### Start Everything Locally (All-in-One)

```bash
./deploy_mac/start-app.sh
```

Starts local Agentuity + chatbot + frontend.

---

### Start Servers Independently (Separate Terminals)

**Terminal 1 - Agentuity:**
```bash
./deploy_mac/start-agentuity.sh
```

**Terminal 2 - Chatbot:**
```bash
./deploy_mac/start-chatbot.sh
```

**Terminal 3 - Frontend:**
```bash
./deploy_mac/start-frontend.sh
```

---

## 🪟 Windows

### Start Everything

Double-click or run:
```powershell
.\deploy_windows\start-backend-frontend.bat
```

---

## ☁️ First-Time Setup: Deploy Agentuity to Cloud

### macOS / Linux

```bash
./deploy_mac/deploy-agentuity-remote.sh
```

### Windows

```powershell
.\deploy_windows\deploy-agentuity-remote.bat
```

Then configure `.env`:
```env
cd 1
# Edit .env and set:
AGENTUITY_URL=https://your-project.agentuity.cloud
```

---

## 🔧 Environment Variables

### macOS / Linux

```bash
# Custom ports
CHATBOT_PORT=4000 FRONTEND_PORT=8080 ./deploy_mac/start-backend-frontend.sh

# Use specific Agentuity
AGENTUITY_URL=https://my-server.com ./deploy_mac/start-chatbot.sh

# Don't open browser
OPEN_BROWSER=false ./deploy_mac/start-frontend.sh
```

### Windows

```powershell
# PowerShell
$env:CHATBOT_PORT=4000
$env:FRONTEND_PORT=8080
.\deploy_windows\start-backend-frontend.bat
```

---

## 🌐 Access URLs

Once running:

- **Frontend**: http://localhost:5173
- **Chatbot API**: http://localhost:3001
- **Agentuity** (if local): http://localhost:3500

---

## 🛑 Stopping Servers

### macOS / Linux

Press **Ctrl+C** in each terminal

### Windows

Close the server windows or:
```powershell
Get-Process -Name node | Stop-Process -Force
```

---

## 📋 Viewing Logs

### macOS / Linux

```bash
# Watch logs in real-time
tail -f chatbot-server.log
tail -f frontend-server.log
tail -f agentuity-server.log

# View all logs together
tail -f *-server.log
```

### Windows

```powershell
# View logs
type chatbot-server.log
type frontend-server.log

# Follow logs (PowerShell)
Get-Content chatbot-server.log -Wait
```

---

## 🔍 Common Issues

### "Port already in use"

**macOS / Linux:**
```bash
# Kill process on port
lsof -ti:3001 | xargs kill -9
```

**Windows:**
```powershell
netstat -ano | findstr :3001
taskkill /PID <pid> /F
```

### "Cannot connect to Agentuity"

1. Check `.env` has correct `AGENTUITY_URL`
2. Test: `curl https://your-project.agentuity.cloud`
3. Redeploy: Run deploy script again

### "API key error"

1. Check `1/.env` has `ANTHROPIC_API_KEY`
2. Get key from: https://console.anthropic.com/

---

## 📚 More Information

- **Mac/Linux Scripts**: [deploy_mac/README.md](deploy_mac/README.md)
- **Windows Scripts**: [deploy_windows/README.md](deploy_windows/README.md)
- **Full Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Agentuity Cloud**: [AGENTUITY_DEPLOYMENT.md](AGENTUITY_DEPLOYMENT.md)
- **Remote Setup**: [REMOTE_SETUP_QUICKSTART.md](REMOTE_SETUP_QUICKSTART.md)

# SnapMap Deployment Guide

This guide explains how to run different parts of the SnapMap application on separate machines or terminals.

## Architecture Overview

The application consists of three independent servers:

1. **Agentuity Server** (Port 3500) - Handles web search and agent tasks
2. **Chatbot Server** (Port 3001) - Handles chat requests and Claude API calls
3. **Frontend Server** (Port 5173) - React development server

## Quick Start (All on One Machine)

To start all servers on one machine:

```bash
./start-app.sh
```

This will start all three servers and open the browser automatically.

## Running Servers Independently

### Option 1: All servers on one machine (separate terminals)

**Terminal 1 - Agentuity Server:**
```bash
./start-agentuity.sh
```

**Terminal 2 - Chatbot Server:**
```bash
./start-chatbot.sh
```

**Terminal 3 - Frontend:**
```bash
./start-frontend.sh
```

### Option 2: Distributed across machines

This setup allows multiple developers to share the same Agentuity server, reducing API calls and improving consistency.

#### Machine 1 (Agentuity Server):

1. Start the Agentuity server:
   ```bash
   ./start-agentuity.sh
   ```

2. Note the **Network URL** displayed (e.g., `http://192.168.1.100:3500`)

3. Share this URL with other team members

#### Machine 2 (Chatbot + Frontend):

1. Update the chatbot `.env` file:
   ```bash
   cd 1
   nano .env
   ```

2. Set the Agentuity URL to the remote server:
   ```
   AGENTUITY_URL=http://192.168.1.100:3500
   ```

3. Start the chatbot server:
   ```bash
   cd ..
   ./start-chatbot.sh
   ```

4. Start the frontend:
   ```bash
   ./start-frontend.sh
   ```

#### Machine 3 (Frontend only):

If you only want to run the frontend on another machine:

1. Update the frontend to point to the remote chatbot server:
   ```bash
   cd snap-map/src
   nano App.jsx
   ```

   Find line 360 and change:
   ```javascript
   const API_URL = 'http://<chatbot-server-ip>:3001';
   ```

2. Start the frontend:
   ```bash
   cd ../..
   ./start-frontend.sh
   ```

## Environment Variables

### Agentuity Server

Set these environment variables before running `start-agentuity.sh`:

- `AGENTUITY_PORT` - Port to run on (default: 3500)
- `AGENTUITY_HOST` - Host to bind to (default: 0.0.0.0 - all interfaces)

Example:
```bash
AGENTUITY_PORT=3500 AGENTUITY_HOST=0.0.0.0 ./start-agentuity.sh
```

### Chatbot Server

Set these environment variables before running `start-chatbot.sh`:

- `CHATBOT_PORT` - Port to run on (default: 3001)
- `AGENTUITY_URL` - URL of Agentuity server (default: http://localhost:3500)

Example:
```bash
CHATBOT_PORT=3001 AGENTUITY_URL=http://192.168.1.100:3500 ./start-chatbot.sh
```

### Frontend Server

Set these environment variables before running `start-frontend.sh`:

- `FRONTEND_PORT` - Port to run on (default: 5173)
- `CHATBOT_API_URL` - URL of chatbot server (default: http://localhost:3001)
- `OPEN_BROWSER` - Open browser automatically (default: true)

Example:
```bash
FRONTEND_PORT=5173 CHATBOT_API_URL=http://192.168.1.100:3001 OPEN_BROWSER=false ./start-frontend.sh
```

## Network Configuration

### Firewall Settings

If running servers on different machines, ensure the following ports are open:

- **Port 3500** - Agentuity server
- **Port 3001** - Chatbot server
- **Port 5173** - Frontend server

**macOS:**
```bash
# Allow incoming connections on these ports
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /usr/local/bin/node
```

**Linux (UFW):**
```bash
sudo ufw allow 3500/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 5173/tcp
```

**Windows:**
```powershell
New-NetFirewallRule -DisplayName "Agentuity" -Direction Inbound -LocalPort 3500 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Chatbot" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

### Finding Your Local IP

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
```

**Windows:**
```powershell
ipconfig | findstr IPv4
```

## Log Files

Each server creates its own log file in the project root:

- `agentuity-server.log` - Agentuity server logs
- `chatbot-server.log` - Chatbot server logs
- `frontend-server.log` - Frontend server logs

View logs in real-time:
```bash
tail -f agentuity-server.log
tail -f chatbot-server.log
tail -f frontend-server.log
```

## Troubleshooting

### Connection Refused Errors

**Problem:** Frontend can't connect to chatbot server

**Solution:**
1. Verify the chatbot server is running: `curl http://localhost:3001/health`
2. Check the `API_URL` in `snap-map/src/App.jsx`
3. Ensure firewall allows connections

**Problem:** Chatbot can't connect to Agentuity server

**Solution:**
1. Verify Agentuity is running: `curl http://localhost:3500`
2. Check `AGENTUITY_URL` in `1/.env`
3. Ensure Agentuity is bound to 0.0.0.0, not 127.0.0.1

### Port Already in Use

**Problem:** Error: "Port already in use"

**Solution:**
```bash
# Find the process using the port
lsof -ti:3500  # Replace with your port

# Kill the process
kill -9 $(lsof -ti:3500)
```

### API Key Errors

**Problem:** Chatbot fails to start with API key error

**Solution:**
1. Check that `1/.env` exists and has valid `ANTHROPIC_API_KEY`
2. Get a key from https://console.anthropic.com/
3. Ensure no extra spaces or quotes around the key

## Development Tips

### Hot Reload

All three servers support hot reload:
- **Frontend**: Vite hot module replacement (automatic)
- **Chatbot**: Restart the server to pick up changes
- **Agentuity**: Watch mode enabled (automatic)

### Debugging

Enable verbose logging:

**Chatbot:**
```bash
NODE_ENV=development ./start-chatbot.sh
```

**View all logs simultaneously:**
```bash
# In separate terminals
tail -f agentuity-server.log
tail -f chatbot-server.log
tail -f frontend-server.log
```

## Production Deployment

For production deployment:

1. Use a process manager like PM2 or systemd
2. Set up proper HTTPS with SSL certificates
3. Use environment-specific `.env` files
4. Configure proper CORS settings
5. Set up a reverse proxy (nginx, Apache)
6. Use a production-ready database setup

Example PM2 configuration:
```bash
pm2 start start-agentuity.sh --name agentuity
pm2 start start-chatbot.sh --name chatbot
pm2 start start-frontend.sh --name frontend
pm2 save
```

## Support

For issues or questions:
1. Check the log files in the project root
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed (`npm install`)
4. Check that ports are not blocked by firewall

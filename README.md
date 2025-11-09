# SnapMap - SNAP Benefits Resource Finder

A web application that helps users find food banks, soup kitchens, SNAP/EBT accepting stores, and get information about SNAP benefits using an AI-powered chatbot.
<img width="2556" height="1349" alt="image" src="https://github.com/user-attachments/assets/734da835-3f6d-4124-bd3a-55e3c5023d38" />

## Features

- **Location-Based Search**: Find food assistance resources by entering your city and state
- **Interactive Map View**: Browse available resources in your area
- **AI-Powered Chatbot**: Ask questions about:
  - Food banks and pantries
  - Soup kitchens and hot meals
  - Stores accepting SNAP/EBT
  - Dietary requirements (Halal, Kosher)
  - How to apply for SNAP benefits
  - SNAP benefit disbursement status

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm
- An Anthropic Claude API key

### 🍎 macOS / Linux

```bash
# 1. Deploy Agentuity to cloud
./deploy_mac/deploy-agentuity-remote.sh

# 2. Configure .env
cd 1 && nano .env
# Set: AGENTUITY_URL and ANTHROPIC_API_KEY

# 3. Start app
cd .. && ./deploy_mac/start-backend-frontend.sh
```

### 🪟 Windows

```powershell
.\deploy_windows\deploy-agentuity-remote.bat
# Edit 1\.env, then run:
.\deploy_windows\start-backend-frontend.bat
```

### All-in-One (Local Agentuity)

```bash
./deploy_mac/start-app.sh
```

Press **Ctrl+C** to stop servers.

## Documentation

- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Complete setup guide
- **[START_SERVERS.md](START_SERVERS.md)** - All ways to start servers
- **[deploy_mac/README.md](deploy_mac/README.md)** - Mac/Linux scripts
- **[deploy_windows/README.md](deploy_windows/README.md)** - Windows scripts
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Advanced deployment
- **[AGENTUITY_DEPLOYMENT.md](AGENTUITY_DEPLOYMENT.md)** - Cloud deployment

## Project Structure

```
Nova-Hacks-2025/
├── deploy_mac/              # Mac/Linux scripts
│   ├── deploy-agentuity-remote.sh
│   ├── start-backend-frontend.sh
│   └── start-app.sh
├── deploy_windows/          # Windows scripts
│   ├── deploy-agentuity-remote.bat
│   └── start-backend-frontend.bat
├── 1/                       # Chatbot backend (Node.js/Express)
│   ├── server.js
│   ├── chatbotHandler.js
│   └── .env
├── snap-map/               # React frontend
│   └── src/App.jsx
├── snapagent/               # Agentuity agent server
│   └── src/agents/
└── Database/
    └── my_records.db       # SQLite database
```

## Using the Application

1. **Enter Your Location**: Select your state and city from the dropdowns
2. **Browse Resources**: View food banks, pantries, and other resources
3. **Chat with SnapBot**: Ask questions in natural language:
   - "Find food banks near me"
   - "Where can I get a hot meal?"
   - "What stores accept SNAP?"
   - "Show me Halal stores that take EBT"
   - "How do I apply for SNAP in Pennsylvania?"
   - "Are SNAP benefits being cancelled?"

## Environment Variables

The chatbot backend requires these environment variables (in `1/.env`):

```env
ANTHROPIC_API_KEY=your_api_key_here
AGENTUITY_URL=https://your-project.agentuity.cloud
CLAUDE_MODEL=claude-haiku-4-5-20251001
PORT=3001
DB_PATH=../Database/my_records.db
```

## Troubleshooting

### Servers won't start
- Check if ports 3001 or 5173 are already in use
- Run `lsof -i :3001` and `lsof -i :5173` to check
- Kill processes with `kill -9 <PID>`

### Chatbot not responding
- Ensure the backend server is running on port 3001
- Check your ANTHROPIC_API_KEY is valid in `.env`
- View logs in `chatbot-server.log`

### Frontend can't connect to backend
- Verify the backend is running: `curl http://localhost:3001/health`
- Check browser console for CORS errors
- Ensure both servers are running

### Database errors
- Verify `Database/my_records.db` exists
- Check the DB_PATH in `chatbot/.env`

## Development

### Adding New Resources

Resources are loaded from `snap-map/public/Pittsburgh.csv` and stored in `Database/my_records.db`. To add resources:

1. Update the CSV file or add entries to the database
2. The app will automatically load and display them

### Modifying Chatbot Behavior

Edit `chatbot/chatbotHandler.js` to customize:
- System prompts
- Query handling logic
- Response formatting

### Customizing the UI

Edit `snap-map/src/App.jsx` to modify:
- Styling
- Component layout
- Form fields

## Technology Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **AI**: Claude Sonnet 4.5 (Anthropic)
- **Database**: SQLite with better-sqlite3
- **Data Parsing**: PapaParse (CSV)

## License

MIT

## Support

For detailed documentation:
- **Start here**: [GETTING_STARTED.md](GETTING_STARTED.md)
- **Backend**: [1/README.md](1/README.md)
- **Scripts**: [deploy_mac/README.md](deploy_mac/README.md) or [deploy_windows/README.md](deploy_windows/README.md)

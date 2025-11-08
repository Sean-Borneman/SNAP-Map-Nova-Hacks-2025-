import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleChatMessage, clearConversation } from './chatbotHandler.js';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Session storage (in production, use Redis or similar)
const sessions = new Map();

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'SnapBot server is running' });
});

/**
 * Create or get session
 */
app.post('/api/session', (req, res) => {
    const sessionId = uuidv4();
    const { city, state } = req.body;

    sessions.set(sessionId, {
        id: sessionId,
        city: city || null,
        state: state || null,
        createdAt: new Date()
    });

    res.json({
        sessionId,
        message: 'Session created successfully'
    });
});

/**
 * Update session location
 */
app.put('/api/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const { city, state } = req.body;

    if (!sessions.has(sessionId)) {
        return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessions.get(sessionId);
    session.city = city || session.city;
    session.state = state || session.state;

    res.json({
        sessionId,
        message: 'Session updated successfully',
        session
    });
});

/**
 * Chat endpoint
 */
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId, city, state } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Use provided sessionId or create a temporary one
        const currentSessionId = sessionId || 'temp_' + Date.now();

        // Get session data if it exists
        let sessionCity = city;
        let sessionState = state;

        if (sessions.has(currentSessionId)) {
            const session = sessions.get(currentSessionId);
            sessionCity = session.city || city;
            sessionState = session.state || state;
        }

        console.log(`[${new Date().toISOString()}] Processing message from session ${currentSessionId}: "${message}"`);

        // Handle the chat message
        const result = await handleChatMessage(
            message,
            currentSessionId,
            sessionCity,
            sessionState
        );

        res.json({
            response: result.response,
            sessionId: currentSessionId,
            requiresFollowup: result.requiresFollowup || false,
            dbResults: result.dbResults || null,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Clear conversation history
 */
app.delete('/api/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;

    clearConversation(sessionId);
    sessions.delete(sessionId);

    res.json({
        message: 'Conversation cleared successfully'
    });
});

/**
 * Get session info
 */
app.get('/api/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;

    if (!sessions.has(sessionId)) {
        return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessions.get(sessionId);
    res.json(session);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🤖 SnapBot server is running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`\n⚙️  Configuration:`);
    console.log(`   - Claude Model: ${process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929'}`);
    console.log(`   - Database: ${process.env.DB_PATH || '../Database/my_records.db'}`);
    console.log(`\n✨ Ready to assist with SNAP benefits!\n`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n⏸️  Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n⏸️  Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

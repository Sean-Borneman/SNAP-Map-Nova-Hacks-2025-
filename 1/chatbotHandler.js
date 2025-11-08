import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import axios from 'axios';
import * as dbQueries from './dbQueries.js';

// Load environment variables
dotenv.config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929';

// Conversation state management
const conversations = new Map();

/**
 * Get or create conversation history
 */
function getConversationHistory(sessionId) {
    if (!conversations.has(sessionId)) {
        conversations.set(sessionId, []);
    }
    return conversations.get(sessionId);
}

/**
 * Add message to conversation history
 */
function addToHistory(sessionId, role, content) {
    const history = getConversationHistory(sessionId);
    history.push({ role, content });

    // Keep only last 20 messages to prevent token limit issues
    if (history.length > 20) {
        history.splice(0, history.length - 20);
    }
}

/**
 * Format database results for display
 */
function formatDatabaseResults(results) {
    if (!results || results.length === 0) {
        return "I couldn't find any matching resources in the database.";
    }

    let response = `I found ${results.length} resource(s):\n\n`;

    results.slice(0, 10).forEach((record, index) => {
        response += `${index + 1}. **${record.name}**\n`;
        response += `   📍 Location: ${record.location}\n`;
        if (record.link) {
            response += `   🔗 Website: ${record.link}\n`;
        }
        response += `   ℹ️ ${record.description}\n\n`;
    });

    if (results.length > 10) {
        response += `\n_Showing first 10 results of ${results.length} total._`;
    }

    return response;
}

/**
 * Perform web search using Agentuity snap-search agent
 */
async function performWebSearch(query, state = null, type = null) {
    const AGENTUITY_URL = process.env.AGENTUITY_URL || 'http://localhost:3500';

    try {
        console.log(`[Agentuity Search] Calling snap-search agent at ${AGENTUITY_URL}`);

        const headers = {
            'Content-Type': 'application/json'
        };

        // Add Agentuity API key if available
        if (process.env.AGENTUITY_API_KEY) {
            headers['Authorization'] = `Bearer ${process.env.AGENTUITY_API_KEY}`;
        }

        const response = await axios.post(`${AGENTUITY_URL}/agent_snap_search_001`, {
            query: query,
            state: state,
            type: type
        }, {
            headers: headers,
            timeout: 20000 // 20 second timeout (Agentuity makes 2 searches with 2-second delay)
        });

        if (response.data && response.data.success && response.data.results) {
            console.log(`[Agentuity Search] Found ${response.data.results.length} results`);
            return response.data.results;
        }

        console.log('[Agentuity Search] No results returned');
        return null;
    } catch (error) {
        console.error('[Agentuity Search] Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('[Agentuity Search] Could not connect to Agentuity agent. Make sure it is running on port 3500');
        }
        return null;
    }
}

/**
 * Use Claude to classify user intent (with retry logic)
 */
async function classifyIntent(userMessage, conversationHistory, retries = 3) {
    const systemPrompt = `You are an intent classifier for a SNAP benefits assistant chatbot. Analyze the user's message and classify it into ONE of these categories:

CATEGORIES:
- greeting: casual greetings or chitchat (hello, hi, how are you, thanks, etc.)
- snap_application: asking how to apply for SNAP benefits
- snap_benefit_status: checking SNAP benefit status, disbursement, cancellations, or government shutdown impacts
- find_food_bank: looking for food banks or food pantries
- find_soup_kitchen: looking for soup kitchens or hot meals
- find_snap_store: looking for stores that accept SNAP/EBT benefits
- find_halal: looking for halal food options or stores
- find_kosher: looking for kosher food options or stores
- general_resources: general request for help or resources in the area
- general_question: general questions about SNAP, eligibility, or benefits
- other: anything that doesn't fit the above categories

Respond with ONLY the category name, nothing else.`;

    const messages = conversationHistory.length > 0
        ? [...conversationHistory, { role: 'user', content: userMessage }]
        : [{ role: 'user', content: userMessage }];

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await anthropic.messages.create({
                model: MODEL,
                max_tokens: 50,
                system: systemPrompt,
                messages: messages
            });

            return response.content[0].text.trim().toLowerCase();
        } catch (error) {
            console.error(`[Intent Classification] Attempt ${attempt}/${retries} failed:`, error.message);

            if (attempt === retries) {
                // On final failure, return a best-guess intent based on keywords
                console.log('[Intent Classification] Falling back to keyword-based classification');
                return classifyByKeywords(userMessage);
            }

            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

/**
 * Fallback keyword-based intent classification
 */
function classifyByKeywords(message) {
    const lowerMessage = message.toLowerCase();

    if (/(hi|hello|hey|good morning|good afternoon|thanks|thank you)/i.test(lowerMessage)) {
        return 'greeting';
    }
    if (/(apply|application|sign up|register|enroll)/i.test(lowerMessage) && /snap|ebt|benefit/i.test(lowerMessage)) {
        return 'snap_application';
    }
    if (/(status|disbursement|cancel|shutdown|when.*benefit|where.*money)/i.test(lowerMessage)) {
        return 'snap_benefit_status';
    }
    if (/halal/i.test(lowerMessage)) {
        return 'find_halal';
    }
    if (/kosher/i.test(lowerMessage)) {
        return 'find_kosher';
    }
    if (/(food bank|pantry|pantries)/i.test(lowerMessage)) {
        return 'find_food_bank';
    }
    if (/(soup kitchen|hot meal|free meal)/i.test(lowerMessage)) {
        return 'find_soup_kitchen';
    }
    if (/(store|shop|market|grocery|where.*buy)/i.test(lowerMessage) && /(snap|ebt)/i.test(lowerMessage)) {
        return 'find_snap_store';
    }
    if (/(resource|help|food|assistance)/i.test(lowerMessage)) {
        return 'general_resources';
    }

    return 'general_question';
}

/**
 * Query database based on intent
 */
function queryDatabaseByIntent(intent, userCity, userState) {
    switch (intent) {
        case 'find_food_bank':
            return {
                type: 'food_bank',
                results: dbQueries.searchByType('food bank', userCity || userState)
            };

        case 'find_soup_kitchen':
            return {
                type: 'soup_kitchen',
                results: dbQueries.searchByType('kitchen', userCity || userState)
            };

        case 'find_snap_store':
            return {
                type: 'snap_stores',
                results: dbQueries.searchSnapAccepting(userCity || userState)
            };

        case 'find_halal':
            return {
                type: 'halal',
                results: dbQueries.searchByDietaryRequirement('halal', userCity || userState)
            };

        case 'find_kosher':
            return {
                type: 'kosher',
                results: dbQueries.searchByDietaryRequirement('kosher', userCity || userState)
            };

        case 'general_resources':
            if (userCity || userState) {
                return {
                    type: 'location',
                    results: dbQueries.getAllByLocation(userCity || userState)
                };
            }
            return null;

        default:
            return null;
    }
}

/**
 * Main chatbot handler
 */
export async function handleChatMessage(userMessage, sessionId, userCity = null, userState = null) {
    try {
        // Get conversation history for context
        const conversationHistory = getConversationHistory(sessionId);

        // Classify the user's intent using Claude
        const intent = await classifyIntent(userMessage, conversationHistory);

        console.log(`[Intent Classification] "${userMessage}" -> ${intent}`);

        // Add user message to history
        addToHistory(sessionId, 'user', userMessage);

        // Route based on intent

        // Handle SNAP application questions
        if (intent === 'snap_application') {
            // Perform web search for SNAP application information
            const searchQuery = `how to apply for SNAP benefits ${userState || ''} 2025`;
            console.log(`[Web Search] Searching for: ${searchQuery}`);
            const searchResults = await performWebSearch(searchQuery, userState, 'snap_application');

            let contextInfo = '';
            if (searchResults && searchResults.length > 0) {
                contextInfo = '\n\nRecent web search results:\n';
                searchResults.forEach((result, index) => {
                    contextInfo += `${index + 1}. ${result.title}\n   ${result.description}\n   Source: ${result.url}\n\n`;
                });
            }

            const systemPrompt = `You are a helpful SNAP benefits assistant. The user is asking about how to apply for SNAP benefits. Their location is ${userCity ? userCity + ', ' : ''}${userState || 'unknown'}.

${searchResults ? 'Use the web search results provided below to give the most current and accurate information.' : 'Provide general guidance on the SNAP application process.'}

Provide a detailed, step-by-step guide on how to apply for SNAP benefits in their state. Include:
1. Eligibility requirements
2. Required documents
3. How to apply (online, in-person, by mail)
4. What to expect during the application process
5. Processing timeline
6. Contact information for their state SNAP office

${contextInfo}

Be specific and provide URLs when available.`;

            const response = await anthropic.messages.create({
                model: MODEL,
                max_tokens: 2000,
                system: systemPrompt,
                messages: [{ role: 'user', content: userMessage }]
            });

            const botResponse = response.content[0].text;
            addToHistory(sessionId, 'assistant', botResponse);

            return {
                response: botResponse,
                requiresFollowup: false
            };
        }

        // Handle SNAP benefit status questions
        if (intent === 'snap_benefit_status') {
            // Perform web search for current SNAP benefit status
            const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const month = new Date().toLocaleString('default', { month: 'long' });
            const year = new Date().getFullYear();
            const searchQuery = `${userState || 'United States'} SNAP benefits ${month} ${year} disbursement schedule`;
            console.log(`[Web Search] Searching for: ${searchQuery} (as of ${currentDate})`);
            const searchResults = await performWebSearch(searchQuery, userState, 'snap_benefit_status');

            let contextInfo = '';
            if (searchResults && searchResults.length > 0) {
                contextInfo = '\n\nRecent web search results:\n';
                searchResults.forEach((result, index) => {
                    contextInfo += `${index + 1}. ${result.title}\n   ${result.description}\n   Source: ${result.url}\n\n`;
                });
            }

            const systemPrompt = `You are a helpful SNAP benefits assistant. The user is asking about current SNAP benefit status and disbursement. Their location is ${userCity ? userCity + ', ' : ''}${userState || 'unknown'}.

CRITICAL INSTRUCTIONS:
1. Use ONLY the web search results provided below to answer
2. Do NOT make assumptions about government shutdowns or benefit cancellations unless explicitly stated in official sources
3. PRIORITIZE and CITE official government sources (.gov domains) including:
   - Executive Orders from President Trump or previous administrations
   - Court orders and judicial rulings
   - Governor actions and state executive orders
   - Official USDA/FNS announcements
4. When citing sources, clearly indicate if they are official government documents (e.g., "According to Executive Order...", "A federal court ruling states...", "The governor of [state] has ordered...")
5. Distinguish between official government actions and news reports about those actions

${searchResults ? 'Based on the web search results below, provide accurate, current information about:' : 'Provide general guidance on how to check their SNAP benefit status:'}
1. Current SNAP benefit disbursement schedule for ${userState || 'their state'}
2. Any executive orders, court orders, or governor actions affecting SNAP benefits
3. When benefits are typically loaded (dates based on case number, etc.)
4. Any actual delays, suspensions, or continuations mentioned in official sources
5. Official resources to check benefit status
6. Contact information for the state SNAP program

${contextInfo}

IMPORTANT:
- Always cite the source URL for each claim, especially when mentioning government actions, court orders, or executive orders
- If the search results show benefits ARE being disbursed normally despite rumors, say so clearly and cite the official source
- ALWAYS END your response with this disclaimer: "⚠️ **Disclaimer**: This information is provided for general guidance only and is not a substitute for professional legal advice. AI can make mistakes even when citing sources. For official information, please contact your state SNAP office or visit your state's official benefits website."`;

            const response = await anthropic.messages.create({
                model: MODEL,
                max_tokens: 2000,
                system: systemPrompt,
                messages: [{ role: 'user', content: userMessage }]
            });

            const botResponse = response.content[0].text;
            addToHistory(sessionId, 'assistant', botResponse);

            return {
                response: botResponse,
                requiresFollowup: false
            };
        }

        // Handle database queries (food banks, soup kitchens, stores, etc.)
        if (['find_food_bank', 'find_soup_kitchen', 'find_snap_store', 'find_halal', 'find_kosher', 'general_resources'].includes(intent)) {
            try {
                const dbResult = queryDatabaseByIntent(intent, userCity, userState);

                if (dbResult && dbResult.results && dbResult.results.length > 0) {
                    let response = formatDatabaseResults(dbResult.results);

                    // Check if this is about SNAP stores and might need follow-up
                    const requiresFollowup = dbResult.type === 'snap_stores' &&
                        intent === 'find_snap_store' &&
                        !['find_halal', 'find_kosher'].includes(intent);

                    if (requiresFollowup) {
                        response += "\n\n💬 Are you looking for specific types of stores? I can help you find Halal or Kosher stores that accept SNAP!";
                    }

                    addToHistory(sessionId, 'assistant', response);

                    return {
                        response,
                        requiresFollowup,
                        dbResults: dbResult.results
                    };
                } else {
                    // No results found in database
                    const noResultsMessage = `I couldn't find any matching resources in my database for ${userCity ? userCity + ', ' : ''}${userState || 'your area'}. Would you like me to provide general information about where to find these resources, or would you like to search for something else?`;

                    addToHistory(sessionId, 'assistant', noResultsMessage);

                    return {
                        response: noResultsMessage,
                        requiresFollowup: false
                    };
                }
            } catch (dbError) {
                console.error('[Database Query] Error:', dbError.message);
                // Fall through to conversational response instead of failing completely
                console.log('[Database Query] Falling back to conversational response');
            }
        }

        // For all other intents (greeting, general_question, other), use Claude for conversational response
        const systemPrompt = `You are SnapBot, a helpful assistant for SNAP (Supplemental Nutrition Assistance Program) benefits and food assistance resources.

User's location: ${userCity ? userCity + ', ' : ''}${userState || 'unknown'}

Your capabilities:
1. Help users find food banks, food pantries, and soup kitchens in their area
2. Locate stores that accept SNAP/EBT benefits (including Halal and Kosher options)
3. Provide detailed guides on how to apply for SNAP benefits in their state
4. Give up-to-date information about SNAP benefit disbursement and government shutdowns
5. Answer general questions about SNAP eligibility and benefits

Be friendly, concise, and helpful. If the user is just greeting you or making small talk, respond warmly and let them know you're here to help with SNAP-related questions.`;

        const response = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 1500,
            system: systemPrompt,
            messages: conversationHistory
        });

        const botResponse = response.content[0].text;
        addToHistory(sessionId, 'assistant', botResponse);

        return {
            response: botResponse,
            requiresFollowup: false
        };

    } catch (error) {
        console.error('[Chatbot Handler] Error:', error);
        console.error('[Chatbot Handler] Stack trace:', error.stack);

        // Add user message to history even if there's an error, so context is preserved
        try {
            addToHistory(sessionId, 'user', userMessage);
        } catch (historyError) {
            console.error('[Chatbot Handler] Could not add to history:', historyError.message);
        }

        // Provide more helpful error messages based on error type
        let errorMessage = "I apologize, but I'm having trouble processing your request right now. ";

        if (error.message.includes('API key')) {
            errorMessage += "There seems to be an issue with the API configuration. Please contact support.";
        } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
            errorMessage += "I'm having trouble connecting to my services. Please check that all servers are running and try again.";
        } else if (error.message.includes('timeout')) {
            errorMessage += "The request took too long. Please try again with a simpler question.";
        } else {
            errorMessage += "Please try again, and if the problem persists, try rephrasing your question.";
        }

        return {
            response: errorMessage,
            error: error.message
        };
    }
}

/**
 * Clear conversation history for a session
 */
export function clearConversation(sessionId) {
    conversations.delete(sessionId);
}

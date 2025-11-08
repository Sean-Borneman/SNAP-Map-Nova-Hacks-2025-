import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import axios from 'axios';

/**
 * Request data interface for SNAP search
 */
interface SnapSearchRequest {
  query: string;
  state?: string | null;
  type?: string | null;
}

/**
 * Welcome message for the SNAP Search agent
 */
export const welcome = () => {
  return {
    welcome:
      'Welcome to the SNAP Search Agent! I can search the web for current SNAP benefit status, application information, and disbursement schedules.',
    prompts: [
      {
        data: 'Search for Pennsylvania SNAP benefit status',
        contentType: 'text/plain',
      },
      {
        data: 'Find information about SNAP application in California',
        contentType: 'text/plain',
      },
    ],
  };
};

/**
 * Perform web search using Google Custom Search API
 */
async function performWebSearch(query: string, count: number = 5) {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    console.log('[Google Search] API key or Search Engine ID not configured');
    return null;
  }

  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_SEARCH_ENGINE_ID,
        q: query,
        num: Math.min(count, 10), // Google allows max 10 results per request
      },
    });

    if (response.data && response.data.items) {
      const results = response.data.items.map((item: any) => ({
        title: item.title,
        description: item.snippet,
        url: item.link,
        isGovSource: item.link.includes('.gov') || item.link.includes('courts.state')
      }));

      // Sort to prioritize .gov and official court sources
      return results.sort((a: any, b: any) => {
        if (a.isGovSource && !b.isGovSource) return -1;
        if (!a.isGovSource && b.isGovSource) return 1;
        return 0;
      });
    }

    return null;
  } catch (error) {
    console.error('[Google Search] Error:', error);
    return null;
  }
}

/**
 * SNAP Search Agent
 * Handles web searches for SNAP benefit information
 */
export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    // Get the search query from the request
    const requestData = await req.data.json() as unknown as SnapSearchRequest;
    const { query, state, type } = requestData;

    ctx.logger.info(`[SNAP Search] Query: "${query}", State: "${state}", Type: "${type}"`);

    let allResults: any[] = [];

    // Construct appropriate search query based on type
    if (type === 'snap_application') {
      const searchQuery = `how to apply for SNAP benefits ${state || ''} 2025`;
      ctx.logger.info(`[SNAP Search] Application query: "${searchQuery}"`);
      const results = await performWebSearch(searchQuery, 5);
      if (results) allResults = results;

    } else if (type === 'snap_benefit_status') {
      const currentDate = new Date().toISOString().split('T')[0];
      const month = new Date().toLocaleString('default', { month: 'long' });
      const year = new Date().getFullYear();

      ctx.logger.info(`[SNAP Search] Searching for benefit status (${currentDate})`);

      // Add delay between searches to avoid rate limiting
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Search 1: Governor actions + Executive orders (HIGHEST PRIORITY)
      if (state) {
        const govQuery = `${state} governor SNAP food stamps executive order Trump action ${year} site:.gov`;
        ctx.logger.info(`[SNAP Search] Governor/Executive query: "${govQuery}"`);
        const govResults = await performWebSearch(govQuery, 5);
        if (govResults) allResults.push(...govResults);
        await delay(2000); // Wait 2 seconds between searches
      } else {
        const execQuery = `SNAP food stamps executive order Trump ${year} site:.gov`;
        ctx.logger.info(`[SNAP Search] Executive order query: "${execQuery}"`);
        const execResults = await performWebSearch(execQuery, 5);
        if (execResults) allResults.push(...execResults);
        await delay(2000);
      }

      // Search 2: Current disbursement schedule + Court orders
      const scheduleCourtQuery = `${state || 'United States'} SNAP benefits ${month} ${year} disbursement schedule court order site:.gov`;
      ctx.logger.info(`[SNAP Search] Schedule/Court query: "${scheduleCourtQuery}"`);
      const scheduleCourtResults = await performWebSearch(scheduleCourtQuery, 5);
      if (scheduleCourtResults) allResults.push(...scheduleCourtResults);

    } else {
      // Default search
      ctx.logger.info(`[SNAP Search] Default query: "${query}"`);
      const results = await performWebSearch(query, 5);
      if (results) allResults = results;
    }

    if (!allResults || allResults.length === 0) {
      return resp.json({
        success: false,
        message: 'No search results found',
        results: [],
      });
    }

    // Remove duplicates based on URL
    const uniqueResults = allResults.filter((result, index, self) =>
      index === self.findIndex((r) => r.url === result.url)
    );

    // Prioritize .gov sources again after combining
    const sortedResults = uniqueResults.sort((a, b) => {
      if (a.isGovSource && !b.isGovSource) return -1;
      if (!a.isGovSource && b.isGovSource) return 1;
      return 0;
    });

    ctx.logger.info(`[SNAP Search] Found ${sortedResults.length} unique results (${sortedResults.filter(r => r.isGovSource).length} from .gov sources)`);

    // Return the search results
    return resp.json({
      success: true,
      query: type === 'snap_benefit_status' ? 'SNAP benefit status with official sources' : query,
      results: sortedResults.slice(0, 10), // Limit to top 10 results
    });

  } catch (error) {
    ctx.logger.error('[SNAP Search] Error:', error);

    return resp.json({
      success: false,
      message: 'Error performing search',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

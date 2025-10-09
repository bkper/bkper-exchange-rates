import { Hono, Context } from 'hono';
import { RatesService } from './services/ratesService';
import { RequestParams } from './types';
import { ContentfulStatusCode } from 'hono/utils/http-status';

const app = new Hono();

// Initialize the rates service
const ratesService = new RatesService();

// Middleware to add CORS headers
app.use('*', async (c: Context, next) => {
    c.header('Access-Control-Allow-Origin', '*'); // Configure as needed
    c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    await next();
});

export const rates = async (c: Context): Promise<Response> => {
    // Handle CORS preflight requests
    if (c.req.method === 'OPTIONS') {
        return c.text('', 204 as ContentfulStatusCode);
    }

    try {
        // Log the request
        console.log(`${new Date().toISOString()} - ${c.req.method} ${c.req.url}`, {
            query: c.req.query(),
            userAgent: c.req.header('User-Agent')
        });

        // Extract parameters from query string
        const params: RequestParams = {
            date: c.req.query('date') || '',
            from: c.req.query('from') || '',
            to: c.req.query('to') || '',
            tab: c.req.query('tab') || '',
            sheetId: c.req.query('sheetId') || '',
            clearCache: c.req.query('clearCache') || ''
        };

        // Process the rates request
        const result = await ratesService.processRatesRequest(params);

        // Send the response
        return c.json(result);

    } catch (error) {
        console.error('Error processing rates request:', error);

        if (error instanceof Error) {
            return c.json({ error: error.message }, 400);
        } else {
            return c.json({ error: 'An unknown error occurred' }, 500);
        }
    }
};

export default app;
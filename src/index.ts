import { Hono, Context } from 'hono';
import { RatesService } from './services/ratesService';
import { RequestParams } from './types';
import { ContentfulStatusCode } from 'hono/utils/http-status';

const app = new Hono<{ Bindings: { GOOGLE_SERVICE_ACCOUNT_KEY: string } }>();

// Middleware to add CORS headers
app.use('*', async (c: Context, next) => {
    c.header('Access-Control-Allow-Origin', '*'); // Configure as needed
    c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    await next();
});

const rates = async (c: Context): Promise<Response> => {
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

        // Initialize rates service with environment
        const ratesService = new RatesService(c.env);
        
        // Process the rates request
        const result = await ratesService.processRatesRequest(params)

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

// Define routes
app.get('/', rates);

export default app;
import { Hono, Context } from 'hono';

const app = new Hono();

// Middleware to add CORS headers
app.use('*', async (c: Context, next) => {
  c.header('Access-Control-Allow-Origin', '*'); // Configure as needed
  c.header('Access-Control-Allow-Methods', 'GET');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  await next();
});

app.get('/', (c: Context) => c.text('Hello from Hono on Cloudflare Workers!'));

app.get('/api/test', (c: Context) => c.json({ message: 'Test endpoint' }));

export default app;
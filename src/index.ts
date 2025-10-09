import { Hono, Context } from 'hono';

const app = new Hono();

app.get('/', (c: Context) => c.text('Hello from Hono on Cloudflare Workers!'));

app.get('/api/test', (c: Context) => c.json({ message: 'Test endpoint' }));

export default app;
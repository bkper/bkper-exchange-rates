# Development Guide

## Prerequisites

- **Node.js**: Version 18+ recommended
- **npm**: Comes with Node.js
- **Cloudflare Account**: For Workers and KV storage
- **Google Cloud Account**: For Sheets API access
- **Git**: For version control

## Development Environment Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd bkper-exchange-rates
npm install
```

### 2. Google Sheets API Setup

#### Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API
4. Create credentials → Service Account
5. Download the JSON key file

#### Configure Local Environment
Create a `.env.local` file in the project root:

```bash
# .env.local (DO NOT commit to git)
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project",...}'
```

Alternatively, set the environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json"
```

### 3. Cloudflare KV Setup

#### Create KV Namespace
```bash
npx wrangler kv:namespace create "RATES_CACHE"
```

This will output a namespace ID. Update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RATES_CACHE"
id = "your-namespace-id-here"
remote = true
```

### 4. Local Development

#### Start Development Server
```bash
npm run dev
```

This will:
- Watch for file changes
- Compile TypeScript
- Start Wrangler dev server on port 8080
- Auto-reload on changes

#### Test the API
```bash
# Test basic functionality
curl "http://localhost:8080/?date=2024-01-15&sheetId=your-sheet-id"

# Test with cache clearing
curl "http://localhost:8080/?clearCache=true&sheetId=your-sheet-id"
```

## Project Structure

```
bkper-exchange-rates/
├── src/
│   ├── index.ts              # Main Hono router and request handler
│   ├── types.ts              # TypeScript type definitions
│   ├── services/
│   │   ├── ratesService.ts   # Main business logic
│   │   ├── sheetsService.ts  # Google Sheets API integration
│   │   └── cacheService.ts   # Cloudflare KV cache management
│   └── utils/
│       └── dateUtils.ts      # Date parsing and formatting utilities
├── dist/                     # Compiled JavaScript output
├── node_modules/             # Dependencies
├── package.json              # Project configuration and scripts
├── tsconfig.json            # TypeScript configuration
├── wrangler.toml            # Cloudflare Workers configuration
├── nodemon.json             # Development server configuration
└── serviceAccount.json      # Google Service Account (local only)
```

### Key Files Explained

#### `src/index.ts`
- Hono.js router setup
- CORS middleware
- Main request handler
- Error handling and logging

#### `src/services/ratesService.ts`
- Core business logic
- Request parameter validation
- Cache vs. fresh data decision logic
- Date range processing

#### `src/services/sheetsService.ts`
- Google Sheets API authentication
- Data fetching methods
- Sheet verification utilities

#### `src/services/cacheService.ts`
- Cloudflare KV operations
- Cache key generation
- TTL management
- Cache clearing functionality

#### `src/utils/dateUtils.ts`
- Date format parsing
- Excel serial number conversion
- Date formatting utilities

## Available Scripts

```bash
# Development
npm run dev          # Start development server with auto-reload
npm run build        # Compile TypeScript to JavaScript
npm run clean        # Remove dist directory

# Deployment
npm run deploy       # Deploy to Cloudflare Workers

# Maintenance
npm install          # Install dependencies
npm update           # Update dependencies
```

## Code Style and Conventions

### TypeScript Configuration

The project uses strict TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node"
  }
}
```

### Coding Standards

1. **Type Safety**: All functions and variables should have explicit types
2. **Error Handling**: Use try/catch blocks and proper error propagation
3. **Async/Await**: Prefer async/await over Promises.then()
4. **Console Logging**: Use descriptive log messages with context
5. **Code Organization**: Keep services focused on single responsibilities

### Example Code Patterns

```typescript
// Service method example
async processRequest(params: RequestParams): Promise<Rates | string> {
    try {
        // Validation
        if (!params.date && !params.from) {
            throw new Error('Please provide date or from parameters');
        }
        
        // Business logic
        const result = await this.fetchRates(params);
        
        return result;
    } catch (error) {
        console.error('Error processing request:', error);
        throw error;
    }
}

// Cache operation example
async get(key: string): Promise<YearRates | null> {
    try {
        const document = await this.env.RATES_CACHE.get(key);
        return document ? JSON.parse(document) as YearRates : null;
    } catch (error) {
        console.error('Error getting cache:', error);
        return null;
    }
}
```

## Testing

### Manual Testing

Test different scenarios during development:

```bash
# Single date request
curl "http://localhost:8080/?date=2024-01-15&sheetId=your-sheet-id"

# Date range request
curl "http://localhost:8080/?from=2024-01-01&to=2024-01-31&sheetId=your-sheet-id"

# Cache clearing
curl "http://localhost:8080/?clearCache=true&sheetId=your-sheet-id"

# Error scenarios
curl "http://localhost:8080/"  # Missing required params
curl "http://localhost:8080/?date=invalid-date"  # Invalid date format
```

### Testing with Different Sheets

Create test sheets with different structures:

1. **Standard Sheet**: Date column + currency columns
2. **Excel Dates**: Using Excel serial numbers
3. **Different Formats**: YYYY/MM/DD vs YYYY-MM-DD
4. **Missing Data**: Gaps in date ranges

## Debugging

### Enable Debug Logging

The application includes comprehensive logging:

```typescript
// Cache operations
console.log('DEBUG: Cache set for', key);
console.log('DEBUG: GOT FROM CACHE');
console.log('DEBUG: GOT FROM SHEET');

// Request logging
console.log(`${new Date().toISOString()} - ${c.req.method} ${c.req.url}`, {
    query: c.req.query(),
    userAgent: c.req.header('User-Agent')
});
```

### Common Debug Scenarios

1. **Cache Issues**: Check KV namespace configuration
2. **Authentication Errors**: Verify service account credentials
3. **Sheet Access**: Ensure service account has read permissions
4. **Date Parsing**: Test with different date formats

### Local Development Tips

1. **Use Real Sheet IDs**: Test with actual Google Sheets
2. **Monitor Console**: Watch for error messages and debug logs
3. **Test Edge Cases**: Try invalid dates, missing sheets, etc.
4. **Cache Testing**: Clear cache frequently during development

## Environment Variables

### Development (.env.local)
```bash
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
DISABLE_CACHE='false'  # Optional: disable caching for testing
NODE_ENV='development'
```

### Available Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Google Service Account JSON | Yes |
| `DEFAULT_SPREADSHEET_ID` | Default sheet ID when not provided | No |
| `DISABLE_CACHE` | Set to 'true' to disable caching | No |
| `NODE_ENV` | Environment mode | No |

## Common Development Issues

### 1. Authentication Errors

**Problem**: "The caller does not have permission"
**Solution**: 
- Verify service account has Sheets API enabled
- Check that the service account email has read access to the sheet
- Ensure credentials are properly formatted JSON

### 2. Cache Not Working

**Problem**: Data always comes from sheets, never cache
**Solution**:
- Check KV namespace ID in wrangler.toml
- Verify RATES_CACHE binding is correct
- Ensure cache isn't disabled via DISABLE_CACHE

### 3. TypeScript Compilation Errors

**Problem**: Build fails with type errors
**Solution**:
- Run `npx tsc` to see detailed errors
- Check imports and exports
- Verify all types are properly defined

### 4. Date Parsing Issues

**Problem**: Dates not recognized from sheets
**Solution**:
- Check date format in Google Sheets
- Test with DateUtils.createDateFromSheetValue()
- Verify Excel serial number handling

## Performance Optimization

### Development Best Practices

1. **Minimize API Calls**: Use cache effectively
2. **Efficient Queries**: Fetch only required data
3. **Error Handling**: Fail fast with clear messages
4. **Memory Usage**: Clean up large objects after processing
5. **Concurrent Requests**: Test with multiple simultaneous requests

### Monitoring During Development

Watch for:
- Response times
- Cache hit/miss ratios
- Memory usage patterns
- Error frequencies

## Building for Production

Before deploying:

```bash
# Clean build
npm run clean
npm run build

# Verify TypeScript compilation
npx tsc --noEmit

# Test the built version
npm run deploy -- --dry-run
```

This ensures your code compiles correctly and is ready for production deployment.
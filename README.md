# BKPER Exchange Rates API

A Cloudflare Workers-based API service that provides exchange rates data from Google Sheets with intelligent caching using Cloudflare KV storage.

## Overview

This service fetches currency exchange rates from Google Sheets and serves them via a REST API. It's designed to work with spreadsheets containing historical exchange rate data and provides both single-date and date-range queries with optimized caching for performance.

## Features

- **Google Sheets Integration**: Fetch exchange rates directly from Google Sheets
- **Intelligent Caching**: Uses Cloudflare KV for fast data retrieval with configurable TTL
- **Date Range Support**: Query single dates or date ranges
- **Excel Date Compatibility**: Handles Excel/Sheets serial date numbers
- **Cache Management**: Clear cache functionality for data refresh
- **CORS Support**: Built-in CORS headers for web applications
- **TypeScript**: Full TypeScript implementation for type safety

## Architecture

The service is built on Cloudflare Workers and follows a clean service-oriented architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Hono Router   │────│  RatesService    │────│  SheetsService  │
│   (index.ts)    │    │ (ratesService.ts)│    │(sheetsService.ts)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                       ┌──────────────────┐             │
                       │   CacheService   │             │
                       │ (cacheService.ts)│             │
                       └──────────────────┘             │
                                │                        │
                       ┌──────────────────┐    ┌─────────────────┐
                       │ Cloudflare KV    │    │ Google Sheets   │
                       │     Storage      │    │      API        │
                       └──────────────────┘    └─────────────────┘
```

### Core Components

- **RatesService**: Main business logic for processing rate requests
- **SheetsService**: Google Sheets API integration and authentication
- **CacheService**: Cloudflare KV cache management with TTL
- **DateUtils**: Utility functions for date parsing and Excel serial numbers

## API Endpoints

### GET /

Fetch exchange rates for a specific date or date range.

#### Query Parameters

| Parameter    | Type   | Required | Description |
|-------------|--------|----------|-------------|
| `date`      | string | No*      | Single date in YYYY-MM-DD format |
| `from`      | string | No*      | Start date for range query (YYYY-MM-DD) |
| `to`        | string | No       | End date for range query (YYYY-MM-DD, defaults to today) |
| `sheetId`   | string | No       | Google Sheets ID (uses default if not provided) |
| `tab`       | string | No       | Sheet tab name (defaults to "Rates") |
| `clearCache`| string | No       | Set to any value to clear cache for the sheet |

*Either `date` or `from` parameter is required.

#### Examples

```bash
# Get rates for a specific date
curl "https://your-worker.your-subdomain.workers.dev/?date=2024-01-15"

# Get rates for a date range
curl "https://your-worker.your-subdomain.workers.dev/?from=2024-01-01&to=2024-01-31"

# Clear cache for a sheet
curl "https://your-worker.your-subdomain.workers.dev/?clearCache=true&sheetId=your-sheet-id"
```

#### Response Format

**Single Date Response:**
```json
{
  "base": "USD",
  "date": "2024-01-15",
  "status": 200,
  "rates": {
    "EUR": "0.92",
    "GBP": "0.79",
    "JPY": "148.50"
  }
}
```

**Date Range Response:**
```json
{
  "base": "USD",
  "status": 200,
  "from": "2024-01-01",
  "to": "2024-01-31",
  "rates": {
    "2024-01-01": {
      "EUR": "0.91",
      "GBP": "0.78"
    },
    "2024-01-02": {
      "EUR": "0.92",
      "GBP": "0.79"
    }
  }
}
```

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js
- **Language**: TypeScript
- **External APIs**: Google Sheets API v4
- **Storage**: Cloudflare KV
- **Build Tool**: TypeScript Compiler
- **Deployment**: Wrangler CLI

## Dependencies

### Production Dependencies
- `hono`: Web framework for Cloudflare Workers
- `googleapis`: Google APIs client library
- `wrangler`: Cloudflare Workers CLI

### Development Dependencies
- `typescript`: TypeScript compiler
- `@cloudflare/workers-types`: Type definitions for Workers
- `@types/node`: Node.js type definitions
- `nodemon`: Development server with auto-reload

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bkper-exchange-rates
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Set up Google Service Account credentials
   - Configure Cloudflare KV namespace
   - See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup

4. **Development**
   ```bash
   npm run dev
   ```

5. **Build and deploy**
   ```bash
   npm run build
   npm run deploy
   ```

## Configuration

The service requires several environment configurations:

- **Google Service Account**: For Sheets API access
- **Cloudflare KV**: For caching functionality
- **Default Spreadsheet ID**: Optional default sheet

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete configuration details.

## Performance

- **Cache TTL**: 24 hours (configurable)
- **Cache Strategy**: Year-based caching for optimal performance
- **Date Range Queries**: Bypasses cache for real-time data
- **Error Handling**: Graceful fallbacks and detailed error messages

## License

ISC License

## Related Documentation

- [API Documentation](./API.md) - Detailed API specifications
- [Development Guide](./DEVELOPMENT.md) - Local development setup
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
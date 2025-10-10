# API Documentation

## Base URL

```
https://your-worker.your-subdomain.workers.dev
```

## Authentication

No authentication required. The service uses Google Service Account credentials configured at the worker level.

## Endpoints

### GET /

Retrieve exchange rates for a specific date or date range from Google Sheets.

#### Headers

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | string | Conditional* | - | Single date in YYYY-MM-DD format |
| `from` | string | Conditional* | - | Start date for range query (YYYY-MM-DD) |
| `to` | string | Optional | Today's date | End date for range query (YYYY-MM-DD) |
| `sheetId` | string | Optional | Environment default | Google Sheets document ID |
| `tab` | string | Optional | "Rates" | Sheet tab/worksheet name |
| `clearCache` | string | Optional | - | Set to any value to clear cache |

\* Either `date` or `from` parameter is required

#### Request Examples

**Single Date Query:**
```bash
curl "https://your-worker.your-subdomain.workers.dev/?date=2024-01-15"
```

**Date Range Query:**
```bash
curl "https://your-worker.your-subdomain.workers.dev/?from=2024-01-01&to=2024-01-31"
```

**Custom Sheet and Tab:**
```bash
curl "https://your-worker.your-subdomain.workers.dev/?date=2024-01-15&sheetId=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms&tab=ExchangeRates"
```

**Clear Cache:**
```bash
curl "https://your-worker.your-subdomain.workers.dev/?clearCache=true&sheetId=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
```

## Response Formats

### Successful Single Date Response

**HTTP Status:** 200 OK

```json
{
  "base": "USD",
  "date": "2024-01-15",
  "status": 200,
  "rates": {
    "EUR": "0.92156",
    "GBP": "0.78543",
    "JPY": "148.75",
    "CAD": "1.34567",
    "AUD": "1.52341",
    "CHF": "0.87234"
  }
}
```

### Successful Date Range Response

**HTTP Status:** 200 OK

```json
{
  "base": "USD",
  "status": 200,
  "from": "2024-01-01",
  "to": "2024-01-03",
  "rates": {
    "2024-01-01": {
      "EUR": "0.91234",
      "GBP": "0.78123",
      "JPY": "147.50"
    },
    "2024-01-02": {
      "EUR": "0.91456",
      "GBP": "0.78234",
      "JPY": "148.25"
    },
    "2024-01-03": {
      "EUR": "0.92156",
      "GBP": "0.78543",
      "JPY": "148.75"
    }
  }
}
```

### Cache Cleared Response

**HTTP Status:** 200 OK

```json
"Rates cache cleared for My Exchange Rates Spreadsheet"
```

### No Data Found Response

**HTTP Status:** 200 OK

```json
{
  "base": "USD",
  "status": 400,
  "rates": {},
  "error": true,
  "message": "not_available",
  "description": "No rates for date 2024-01-15 available"
}
```

## Error Responses

### Missing Required Parameters

**HTTP Status:** 400 Bad Request

```json
{
  "error": "Please provide date or from parameters"
}
```

### Missing Sheet ID

**HTTP Status:** 400 Bad Request

```json
{
  "error": "Please provide the sheetId parameter"
}
```

### Invalid Date Format

**HTTP Status:** 400 Bad Request

```json
{
  "error": "Invalid date format in range: 2024/13/01 to 2024-01-31"
}
```

### Sheet Not Found

**HTTP Status:** 400 Bad Request

```json
{
  "error": "Sheet ExchangeRates not found on My Spreadsheet"
}
```

### Google Sheets API Error

**HTTP Status:** 400 Bad Request

```json
{
  "error": "Failed to get sheet data: The caller does not have permission"
}
```

### Internal Server Error

**HTTP Status:** 500 Internal Server Error

```json
{
  "error": "An unknown error occurred"
}
```

## Rate Limiting

No explicit rate limiting is implemented, but requests are subject to:
- Cloudflare Workers execution limits
- Google Sheets API quotas
- Cloudflare KV operation limits

## Caching Behavior

### Cache Strategy

- **Cache Key Format:** `{spreadsheetId}_{year}`
- **Cache TTL:** 24 hours (86,400 seconds)
- **Cache Storage:** Cloudflare KV
- **Cache Scope:** Per year, per spreadsheet

### Cache Behavior by Request Type

1. **Single Date Requests:**
   - First checks cache for the year
   - If cache miss, fetches full year data from Google Sheets
   - Caches the entire year's data
   - Returns the specific date's rates

2. **Date Range Requests:**
   - Bypasses cache entirely
   - Always fetches fresh data from Google Sheets
   - Does not update cache

3. **Cache Clearing:**
   - Removes all cached entries for the specified spreadsheet
   - Affects all years cached for that spreadsheet

### Cache Expiration

- Cache entries include a `createdAt` timestamp
- Entries are automatically expired and deleted after 24 hours
- Expired entries are removed on next access attempt

## Data Format Requirements

### Google Sheets Structure

The Google Sheets document should be structured as follows:

```
| Date       | EUR     | GBP     | JPY      | CAD     | ... |
|------------|---------|---------|----------|---------|-----|
| 2024-01-01 | 0.91234 | 0.78123 | 147.50   | 1.34567 | ... |
| 2024-01-02 | 0.91456 | 0.78234 | 148.25   | 1.34789 | ... |
| 2024-01-03 | 0.92156 | 0.78543 | 148.75   | 1.35012 | ... |
```

**Requirements:**
- First column must contain dates
- First row must contain currency codes as headers
- Date formats supported:
  - YYYY-MM-DD (preferred)
  - YYYY/MM/DD
  - Excel serial date numbers
- Rate values must be numeric

### Date Handling

The service supports multiple date formats:

1. **ISO Date Strings:** `2024-01-15`
2. **Alternative Format:** `2024/01/15`
3. **Excel Serial Numbers:** `45306` (automatically converted)
4. **Date Objects:** Native JavaScript Date objects

## Performance Considerations

### Optimization Features

- **Year-based Caching:** Reduces API calls by caching entire years
- **Intelligent Cache Lookup:** Returns cached data when available
- **Minimal Data Transfer:** Only fetches required year ranges
- **Concurrent Request Handling:** Cloudflare Workers handle concurrent requests efficiently

### Best Practices

1. **Use Consistent Date Formats:** Stick to YYYY-MM-DD format
2. **Minimize Cache Clearing:** Only clear cache when data updates are critical
3. **Batch Date Range Requests:** Use range queries instead of multiple single-date requests
4. **Monitor KV Usage:** Be aware of Cloudflare KV limits in high-traffic scenarios

## CORS Support

The API includes full CORS support for browser-based applications:

- **Access-Control-Allow-Origin:** `*` (configurable)
- **Access-Control-Allow-Methods:** `GET, OPTIONS`
- **Access-Control-Allow-Headers:** `Content-Type, Authorization`
- **OPTIONS Preflight:** Automatically handled

## Monitoring and Debugging

### Request Logging

All requests are logged with:
- Timestamp
- HTTP method and URL
- Query parameters
- User agent
- Processing time

### Debug Information

Cache operations include debug logging:
- Cache hits/misses
- Cache expiration events
- Cache clearing operations
- Data source indicators ("GOT FROM CACHE" vs "GOT FROM SHEET")

### Error Tracking

Errors are logged with:
- Stack traces for debugging
- Request context
- External API response details
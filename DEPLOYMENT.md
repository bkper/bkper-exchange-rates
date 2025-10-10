# Deployment Guide

## Overview

This guide covers deploying the BKPER Exchange Rates API to Cloudflare Workers with proper configuration for Google Sheets integration and KV storage.

## Prerequisites

- **Cloudflare Account**: With Workers plan
- **Google Cloud Account**: For Sheets API
- **Wrangler CLI**: Latest version installed
- **Node.js**: Version 18+ for local builds

## Pre-Deployment Setup

### 1. Google Cloud Configuration

#### Create Google Cloud Project
```bash
# Install Google Cloud CLI if needed
curl https://sdk.cloud.google.com | bash
gcloud init
```

#### Enable Google Sheets API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to "APIs & Services" → "Library"
4. Search for "Google Sheets API" and enable it

#### Create Service Account
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in service account details:
   - **Name**: bkper-exchange-rates-worker
   - **Description**: Service account for exchange rates API
4. Click "Create and Continue"
5. Skip role assignment (not needed for this use case)
6. Click "Done"

#### Generate Service Account Key
1. Find your service account in the credentials list
2. Click on the service account email
3. Go to "Keys" tab
4. Click "Add Key" → "Create new key"
5. Select "JSON" format
6. Download the key file

#### Grant Sheet Access
For each Google Sheet you want to access:
1. Open the Google Sheet
2. Click "Share" button
3. Add the service account email (found in the JSON key file)
4. Set permission to "Viewer"
5. Uncheck "Notify people" if desired

### 2. Cloudflare Workers Setup

#### Install and Authenticate Wrangler
```bash
npm install -g wrangler
wrangler login
```

#### Create KV Namespace
```bash
# Create production KV namespace
wrangler kv:namespace create "RATES_CACHE"

# Note the output namespace ID for wrangler.toml
```

#### Update wrangler.toml
Replace the namespace ID in `wrangler.toml`:

```toml
name = "bkper-exchange-rates"
main = "dist/index.js"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[dev]
port = 8080

[vars]
# GOOGLE_SERVICE_ACCOUNT_KEY will be provided via wrangler secret

[[kv_namespaces]]
binding = "RATES_CACHE"
id = "your-actual-namespace-id-here"  # Replace with your ID
remote = true
```

## Deployment Process

### 1. Set Environment Secrets

#### Configure Service Account Key
```bash
# Set the Google Service Account key as a secret
wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY

# When prompted, paste the entire content of your service account JSON file
# It should be a single line JSON string like:
# {"type":"service_account","project_id":"your-project",...}
```

#### Optional: Set Default Spreadsheet ID
```bash
# If you want a default spreadsheet for requests without sheetId
wrangler secret put DEFAULT_SPREADSHEET_ID

# When prompted, enter your default Google Sheets ID
```

### 2. Build and Deploy

#### Production Build
```bash
# Clean and build
npm run clean
npm run build

# Verify TypeScript compilation
npx tsc --noEmit
```

#### Deploy to Cloudflare Workers
```bash
# Deploy to production
npm run deploy

# Or use wrangler directly
wrangler deploy
```

#### Verify Deployment
```bash
# Test the deployed worker
curl "https://your-worker.your-subdomain.workers.dev/?date=2024-01-15&sheetId=your-sheet-id"
```

## Production Configuration

### Environment Variables / Secrets

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Secret | Yes | Google Service Account JSON key |
| `DEFAULT_SPREADSHEET_ID` | Secret | No | Default Google Sheets ID |

### Cloudflare Workers Settings

#### Resource Limits
- **CPU Time**: 100ms per request (Workers plan)
- **Memory**: 128MB
- **Request Timeout**: 30 seconds

#### KV Storage Limits
- **Keys**: 10 billion per account
- **Key Size**: 512 bytes max
- **Value Size**: 25MB max
- **Operations**: See Cloudflare pricing

### Custom Domain Setup (Optional)

#### Add Custom Domain
1. Go to Cloudflare Workers dashboard
2. Select your worker
3. Go to "Triggers" tab
4. Click "Add Custom Domain"
5. Enter your domain (e.g., `api.yourcompany.com`)
6. Follow DNS configuration instructions

#### Update DNS
Add CNAME record pointing to your worker:
```
api.yourcompany.com CNAME your-worker.your-subdomain.workers.dev
```

## Production Monitoring

### Enable Analytics

#### Cloudflare Analytics
1. Go to Workers dashboard
2. Select your worker
3. View "Analytics" tab for:
   - Request volume
   - Response times
   - Error rates
   - Geographic distribution

#### Custom Logging
The application includes built-in logging:
```typescript
console.log(`${new Date().toISOString()} - ${method} ${url}`, {
    query: params,
    userAgent: userAgent
});
```

### Performance Monitoring

#### Key Metrics to Monitor
- **Response Time**: Should be <100ms for cached requests
- **Cache Hit Rate**: Aim for >80% for optimal performance
- **Error Rate**: Should be <1% under normal conditions
- **KV Operations**: Monitor read/write operations

#### Alerting Setup
Consider setting up alerts for:
- High error rates (>5%)
- Slow response times (>500ms)
- KV storage approaching limits
- Google Sheets API quota issues

## Security Considerations

### Service Account Security
- **Principle of Least Privilege**: Only grant read access to required sheets
- **Key Rotation**: Rotate service account keys periodically
- **Monitoring**: Monitor service account usage in Google Cloud Console

### API Security
- **CORS Configuration**: Adjust CORS settings as needed for your use case
- **Rate Limiting**: Consider implementing rate limiting for high-traffic scenarios
- **Input Validation**: All inputs are validated, but monitor for abuse

### Secrets Management
- **Never Commit Secrets**: Ensure service account keys are never in source control
- **Environment Isolation**: Use different service accounts for dev/staging/prod
- **Access Control**: Limit who can modify worker secrets

## Troubleshooting

### Common Deployment Issues

#### 1. Authentication Errors
**Symptom**: "The caller does not have permission"
**Solutions**:
```bash
# Verify secret is set correctly
wrangler secret list

# Check service account permissions in Google Sheets
# Verify the service account email has access to the sheet
```

#### 2. KV Namespace Issues
**Symptom**: Cache operations fail
**Solutions**:
```bash
# List your KV namespaces
wrangler kv:namespace list

# Verify namespace ID in wrangler.toml matches
# Check KV operations in Cloudflare dashboard
```

#### 3. Build Failures
**Symptom**: TypeScript compilation errors
**Solutions**:
```bash
# Check TypeScript errors
npx tsc

# Clean and rebuild
npm run clean
npm run build

# Verify all dependencies are installed
npm install
```

### Production Debugging

#### Enable Debug Mode
```bash
# Temporarily disable cache for debugging
wrangler secret put DISABLE_CACHE
# Set value to "true"
```

#### View Real-time Logs
```bash
# Tail worker logs
wrangler tail

# Filter for errors only
wrangler tail --format=pretty | grep -i error
```

#### Test Specific Scenarios
```bash
# Test cache clearing
curl "https://your-worker.workers.dev/?clearCache=true&sheetId=your-sheet-id"

# Test with invalid dates
curl "https://your-worker.workers.dev/?date=invalid-date"

# Test missing parameters
curl "https://your-worker.workers.dev/"
```

## Scaling Considerations

### High Traffic Optimization

#### Caching Strategy
- **TTL Tuning**: Adjust cache TTL based on data update frequency
- **Cache Warming**: Implement cache warming for frequently accessed data
- **Regional Distribution**: Cloudflare automatically handles global distribution

#### Performance Optimization
```typescript
// Consider implementing request batching for multiple date requests
// Use concurrent processing where possible
// Optimize data structures for faster parsing
```

### Cost Management

#### Monitor Usage
- **Worker Requests**: Track request volume
- **KV Operations**: Monitor read/write operations
- **Google Sheets API**: Watch quota usage

#### Optimization Tips
- Use caching effectively to reduce Sheets API calls
- Implement request deduplication if needed
- Consider data compression for large responses

## Backup and Recovery

### Data Backup
- **Source Data**: Google Sheets serve as the source of truth
- **Cache Data**: KV storage is ephemeral; data can be rebuilt from sheets
- **Configuration**: Keep wrangler.toml and service account configs backed up

### Recovery Procedures
1. **Service Outage**: Redeploy from source code
2. **Data Issues**: Clear cache and rebuild from Google Sheets
3. **Authentication Issues**: Regenerate service account keys

## Rollback Procedures

### Quick Rollback
```bash
# If you need to rollback to a previous version
wrangler rollback

# Or redeploy from a specific commit
git checkout <previous-commit>
npm run build
npm run deploy
```

### Zero-Downtime Deployment
Cloudflare Workers automatically handle zero-downtime deployments. New code is deployed globally within seconds.

## Support and Maintenance

### Regular Maintenance Tasks
- Monitor Google Sheets API quota usage
- Review and rotate service account keys
- Update dependencies regularly
- Monitor cache hit rates and adjust TTL if needed

### Getting Help
- **Cloudflare Workers**: [Documentation](https://developers.cloudflare.com/workers/)
- **Google Sheets API**: [Documentation](https://developers.google.com/sheets/api)
- **Wrangler CLI**: [Documentation](https://developers.cloudflare.com/workers/wrangler/)
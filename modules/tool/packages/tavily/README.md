# Tavily AI Search Tool

AI-powered web search and content extraction toolset.

## Features

### Search Tool
- **AI-powered search** with relevance ranking
- **Answer generation** - Get AI-generated summaries
- **Flexible depth** - Basic (fast) or Advanced (comprehensive)
- **Result control** - Configure max results (1-20)

### Extract Tool
- **Web content extraction** from single or multiple URLs
- **Format options** - Markdown or plain text output
- **Batch processing** - Extract multiple URLs in one call
- **Error handling** - Track successful and failed extractions

## Configuration

### API Key
Required: Tavily API Key (format: `tvly-xxxxxxxxxxxxxxxxxxxxxxxx`)

Get your API key at: https://tavily.com

## Tools

### 1. AI Search
**Inputs:**
- `query` (required) - Search query string
- `searchDepth` - "basic" or "advanced" (default: basic)
- `maxResults` - Number of results 1-20 (default: 10)
- `includeAnswer` - Generate AI summary (default: false)

**Outputs:**
- `answer` - AI-generated summary (if enabled)
- `results` - Array of search results with title, url, content, score
- `resultCount` - Total number of results

### 2. Content Extract
**Inputs:**
- `urls` (required) - Single URL or multiple URLs (one per line)
- `format` - "markdown" or "text" (default: markdown)

**Outputs:**
- `results` - Array of extracted content with url, content, title
- `successCount` - Number of successfully extracted URLs
- `failedUrls` - List of failed URLs with error messages

## API Credits

- **Basic Search**: 1 credit per search
- **Advanced Search**: 2 credits per search
- **Extract**: 1 credit per 5 URLs (basic depth)

## File Structure

```
tavily/
├── config.ts          # Toolset configuration
├── index.ts           # Toolset export
├── client.ts          # API client & error handling
├── types.ts           # TypeScript interfaces
└── children/
    ├── search/        # Search tool
    │   ├── config.ts
    │   ├── index.ts
    │   └── src/index.ts
    └── extract/       # Extract tool
        ├── config.ts
        ├── index.ts
        └── src/index.ts
```

## Development

Built with:
- Zod for runtime validation
- Axios for HTTP requests
- TypeScript for type safety

Build: `npm run build`

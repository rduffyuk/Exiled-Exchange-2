# Exiled Exchange 2 - AI Bridge Service

LibreChat integration service for Exiled Exchange 2, providing AI-powered trading insights while maintaining GGG compliance.

## Features

- 🤖 **LibreChat Integration** - Connect your local LibreChat to Exiled Exchange 2
- 📈 **AI Price Analysis** - Get intelligent item valuations and market insights  
- 🛡️ **GGG Compliant** - Uses only official APIs and public data sources
- ⚡ **Rate Limited** - Built-in rate limiting to respect API limits
- 🔐 **Secure** - Docker containerized with security best practices

## Quick Start

### Prerequisites
- Docker and Docker Compose
- LibreChat running locally (default: http://localhost:3080)
- Exiled Exchange 2 installed

### Installation

1. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```

2. **Configure LibreChat URL in .env:**
   ```bash
   LIBRECHAT_URL=http://localhost:3080
   ```

3. **Start the bridge service:**
   ```bash
   docker-compose up -d
   ```

4. **Verify service is running:**
   ```bash
   curl http://localhost:3001/health
   ```

## API Endpoints

### Health Check
```bash
GET /health
```
Returns service status and health information.

### Chat Interface
```bash
POST /api/chat
Content-Type: application/json

{
  "message": "Analyze this Rare Sword with +50% increased Physical Damage",
  "context": {
    "conversationId": "optional-conversation-id",
    "model": "gpt-4"
  }
}
```

### Enhanced Price Check
```bash
POST /api/price-check
Content-Type: application/json

{
  "itemText": "Rarity: Rare\\nIron Sword\\n+50% increased Physical Damage",
  "league": "Hardcore"
}
```

### Market Intelligence
```bash
GET /api/market/{league}?currency=divine
```

## Integration with Exiled Exchange 2

The bridge service automatically connects to your Exiled Exchange 2 installation and provides:

- **AI-Enhanced Price Checking** - Adds intelligent analysis to existing price checks
- **Natural Language Queries** - Ask questions about items in plain English  
- **Market Insights** - AI-powered market trend analysis
- **Crafting Advice** - Intelligent crafting strategy recommendations

## GGG Compliance

This service maintains full compliance with Grinding Gear Games Terms of Service:

✅ **What we DO:**
- Use official Path of Exile trade API with proper rate limiting
- Process publicly available market data
- Provide analysis and recommendations
- Run completely external to the game client

❌ **What we DON'T DO:**
- Read game memory or modify game files
- Automate any in-game actions
- Exceed API rate limits
- Provide unfair gameplay advantages

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Runtime environment |
| `AI_BRIDGE_PORT` | `3001` | Service port |
| `LIBRECHAT_URL` | `http://localhost:3080` | LibreChat instance URL |
| `RATE_LIMIT_POINTS` | `45` | API requests per minute |
| `ENABLE_MARKET_ANALYSIS` | `true` | Enable market intelligence features |

### Feature Flags

- `ENABLE_MARKET_ANALYSIS` - Market trend analysis and predictions
- `ENABLE_CRAFTING_ADVICE` - AI-powered crafting recommendations  
- `ENABLE_BUILD_OPTIMIZATION` - Character build optimization (coming soon)

## Development

### Local Development
```bash
npm install
npm run dev
```

### Testing
```bash
npm test
```

### Docker Development
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Troubleshooting

### LibreChat Connection Issues
1. Verify LibreChat is running: `curl http://localhost:3080/api/config`
2. Check network connectivity between containers
3. Ensure firewall allows connections on port 3080

### Rate Limiting
If you encounter rate limiting errors:
1. Reduce `RATE_LIMIT_POINTS` in .env
2. Increase `RATE_LIMIT_DURATION` for longer windows
3. Check GGG's current rate limiting policies

### Performance Issues
- Increase container resources if AI responses are slow
- Use faster AI models in LibreChat for quicker responses
- Enable caching for frequently requested data

## API Rate Limits (GGG Compliance)

- **Trade API**: 45 requests per 60 seconds per IP
- **Automatic backoff** on rate limit hits
- **Request queuing** to prevent API abuse
- **Graceful degradation** when APIs are unavailable

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper tests
4. Ensure GGG compliance is maintained
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

- **GitHub Issues**: Report bugs and feature requests
- **Discord**: Join the community for support
- **Documentation**: Check the wiki for detailed guides

---

**⚠️ Disclaimer**: This tool is not affiliated with or endorsed by Grinding Gear Games. Use at your own risk. Always comply with GGG's Terms of Service.
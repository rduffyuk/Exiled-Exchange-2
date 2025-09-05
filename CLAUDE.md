# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Exiled Exchange 2 is a Path of Exile 2 overlay application for price checking items and trading assistance. It's built as an Electron application with a Vue.js frontend and includes AI-enhanced features through LibreChat integration.

## Development Commands

### Standard Development Workflow
```bash
# Start renderer (Vue.js frontend)
cd renderer
npm install
npm run make-index-files  # Required on first setup
npm run dev

# Start main process (Electron backend) - in separate terminal
cd main  
npm install
npm run dev
```

### AI-Enhanced Development
```bash
# Start AI Bridge service - in separate terminal
cd ai-bridge
npm install
npm start

# For development with AI features enabled
cd main
ELECTRON_ENABLE_LOGGING=1 ELECTRON_DISABLE_SANDBOX=1 npm run dev
```

### Build and Package
```bash
# Build renderer
cd renderer
npm run build

# Build main
cd main  
npm run build

# Create distributable package
cd main
npm run package
```

### Code Quality
```bash
# Lint and format renderer
cd renderer
npm run lint
npm run format

# Lint and format main
cd main
npm run lint
npm run fix
npm run format
```

### Testing
```bash
# Run tests in renderer
cd renderer
npm test

# Health check AI Bridge
curl http://localhost:3001/health
```

## Architecture Overview

### Multi-Process Electron Architecture
- **Main Process** (`main/`): Electron backend handling system integration, overlays, global shortcuts, IPC
- **Renderer Process** (`renderer/`): Vue.js frontend with game overlay UI, price checking interface
- **AI Bridge Service** (`ai-bridge/`): Express.js microservice connecting to LibreChat for AI features

### Key Communication Patterns
- **WebSocket-based IPC**: Main ↔ Renderer via `sockette` (not traditional Electron IPC)
- **HTTP API**: Renderer ↔ AI Bridge via fetch/axios
- **Game Integration**: uIOhook for global shortcuts, overlay positioning system

### Core Systems

**Widget System** (`renderer/src/web/overlay/`):
- Widget-based overlay architecture with `WidgetManager`
- Main widget: `PriceCheckWidget` handles price checking flow
- Supports single/multi-instance widgets with specific behavior flags
- Each widget has `initInstance()` function defining default configuration

**Price Checking Flow** (`renderer/src/web/price-check/`):
- `PriceCheckWindow.vue`: Main overlay container
- `CheckedItem.vue`: Core price checking logic and AI integration
- `FiltersBlock.vue`: Search filters and trading parameters  
- Enhanced with AI insights, chat, and market analysis

**Game Integration** (`main/src/`):
- `GameWindow.ts`: Detects Path of Exile 2 window state
- `OverlayWindow.ts`: Manages overlay positioning and visibility
- `Shortcuts.ts`: Global hotkey handling (default: Ctrl+D for price check)

### AI Integration Architecture

**AI Bridge Service** (`ai-bridge/`):
- Express.js server on port 3001
- LibreChat integration with multiple AI models
- GGG-compliant rate limiting (45 requests/60 seconds)
- Cloudflare Access authentication handling
- Graceful fallbacks when AI services unavailable

**AI Components** (`renderer/src/web/ai-bridge/` and `renderer/src/web/price-check/ai-insights/`):
- `AIBridgeClient.ts`: HTTP client for AI communication
- `AIInsightsPanel.vue`: Displays AI analysis and confidence levels
- `AIChatDialog.vue`: Interactive AI chat about items
- `AIStatusIndicator.vue`: Real-time service health monitoring

**AI-Enhanced Pricing** (`renderer/src/web/price-check/price-prediction/`):
- `ai-enhanced-pricing.ts`: Combines traditional poeprices.info with AI insights
- Fallback mechanisms ensure reliability when AI unavailable
- Multiple AI model support (Multimodal Pro, Lite, Code Specialist, etc.)

## Configuration and Data Flow

### Widget Configuration
Widgets are defined with `WidgetSpec` interface including:
- `initInstance()`: Default widget configuration
- Widget-specific properties (hotkeys, display options, AI settings)
- Runtime state management through `WidgetManager`

### Price Check Data Flow
1. User copies item in Path of Exile 2
2. Global shortcut triggers `MAIN->CLIENT::item-text` event
3. `CheckedItem.vue` processes item through multiple services:
   - Traditional price checking (poeprices.info, poe.ninja)
   - AI analysis via AI Bridge → LibreChat
   - Market trend analysis
4. Results displayed with fallback handling

### AI Service Integration
- **Health Monitoring**: Continuous health checks via `/health` endpoint
- **Model Selection**: Configurable AI models through LibreChat
- **Authentication**: Cloudflare Access integration with fallback modes
- **Error Handling**: Comprehensive fallback to ensure app functionality

## Linux-Specific Considerations

### Electron Sandbox Issues
Use sandbox-disabled mode for development:
```bash
ELECTRON_ENABLE_LOGGING=1 ELECTRON_DISABLE_SANDBOX=1 npm run dev
```

### Permission Requirements
- Accessibility permissions needed for global shortcuts
- Network permissions for price checking APIs
- Local server permissions for AI Bridge service

## Important File Patterns

### Widget Implementation
- Widget Vue components in `renderer/src/web/overlay/`
- Widget interfaces in `renderer/src/web/overlay/widgets.ts`
- Widget initialization in component's `widget` property

### Price Check Extensions
- Core logic in `CheckedItem.vue`
- AI enhancements as separate Vue components
- Price prediction services in `price-prediction/` directory

### AI Feature Development
- HTTP-based communication (not traditional IPC)
- Fallback-first design pattern
- TypeScript interfaces for AI responses
- Vue composition API for reactive AI state

## GGG Compliance Requirements

This application must respect Grinding Gear Games' Terms of Service:
- **Rate Limiting**: 45 requests per 60 seconds maximum
- **Official APIs Only**: Use only approved trade API endpoints  
- **No Game Modification**: Overlay-only approach, no game file changes
- **Respectful Caching**: Implement intelligent caching to reduce API load

Rate limiting is implemented in `ai-bridge/server.js` using `rate-limiter-flexible`.

## Development Notes

### TypeScript Configuration
- Main process: Node.js TypeScript with Electron types
- Renderer process: Vue 3 + TypeScript with strict type checking
- AI Bridge: Node.js with Express types

### Vue.js Patterns Used
- Composition API for reactive state management
- `<script setup>` syntax for component logic
- `defineEmits` and `defineProps` for component communication
- Computed properties for derived AI state

### AI Integration Patterns
- Direct HTTP communication over WebSocket IPC for AI features
- Graceful degradation when AI services unavailable
- Multiple AI model support through LibreChat configuration
- Real-time status monitoring and user feedback

### Common Development Issues
- **Electron Sandbox**: Use `ELECTRON_DISABLE_SANDBOX=1` on Linux
- **AI Authentication**: LibreChat behind Cloudflare Access requires special handling
- **Widget State**: Widgets persist state between show/hide cycles
- **TypeScript Errors**: Run `npm run build` to check for type issues before commits
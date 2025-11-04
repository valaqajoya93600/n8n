# GoHighLevel AI Assistant Module

This module implements a multi-tenant SaaS application for integrating AI-powered assistant capabilities with GoHighLevel (GHL) platform using a BYOK (Bring Your Own Key) model.

## What's Been Implemented

### Database Schema
✅ Entity models created (`packages/@n8n/db/src/entities/`):
- `ghl-client.entity.ts` - Multi-tenant client management
- `ghl-ai-provider.entity.ts` - AI provider configurations (encrypted API keys)
- `ghl-conversation-session.entity.ts` - Conversation context & memory
- `ghl-available-model.entity.ts` - Catalog of supported AI models
- `ghl-usage-log.entity.ts` - Analytics and token tracking
- `ghl-webhook-log.entity.ts` - GHL webhook debugging logs

✅ Database migrations created:
- `packages/@n8n/db/src/migrations/common/1762256012783-CreateGhlTables.ts`
- Registered in PostgreSQL, MySQL, and SQLite migration indexes

### Services
✅ `encryption.service.ts` - AES-256-GCM encryption for API keys

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│           GoHighLevel Integration Layer             │
├─────────────────────────────────────────────────────┤
│                                                      │
│  GHL Webhook → GHL Conversation Handler             │
│       ↓                                              │
│  Retrieve Client Config (locationId)                │
│       ↓                                              │
│  Load AI Provider (decrypted API key)               │
│       ↓                                              │
│  Load/Create Conversation Session (memory)          │
│       ↓                                              │
│  Execute AI Agent with MCP Tools                    │
│       ↓                                              │
│  Track Usage (tokens, cost)                         │
│       ↓                                              │
│  Send Response to GHL Conversation API              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## What Still Needs To Be Implemented

### 1. Repositories (`packages/@n8n/db/src/repositories/`)
- `ghl-client.repository.ts`
- `ghl-ai-provider.repository.ts`
- `ghl-conversation-session.repository.ts`
- `ghl-available-model.repository.ts`
- `ghl-usage-log.repository.ts`
- `ghl-webhook-log.repository.ts`

### 2. AI Provider Factory & Implementations
- `ai-provider/factory.ts` - Factory pattern for provider instantiation
- `ai-provider/providers/openai.provider.ts`
- `ai-provider/providers/anthropic.provider.ts`
- `ai-provider/providers/groq.provider.ts`
- `ai-provider/providers/together.provider.ts`
- `ai-provider/providers/ollama.provider.ts`

### 3. Core Services
- `ghl-client.service.ts` - Client management
- `ghl-conversation.service.ts` - Conversation handling & memory
- `ghl-webhook.service.ts` - Webhook processing
- `ghl-usage-tracking.service.ts` - Analytics & cost tracking

### 4. Controllers (`packages/cli/src/controllers/`)
- `ghl-webhook.controller.ts` - Handle GHL webhooks
- `ghl-settings.controller.ts` - Client configuration API
- `ghl-ai-provider.controller.ts` - Provider management API
- `ghl-analytics.controller.ts` - Usage analytics API

### 5. Enhanced GoHighLevel Nodes
Update existing or create new nodes in `packages/nodes-base/nodes/HighLevel/`:
- Add Conversation resource
- Add message sending/receiving
- Add conversation context retrieval
- Integrate with AI agent capabilities

### 6. Frontend (Settings UI)
Create in `packages/frontend/editor-ui/src/views/`:
- `GhlAiSettings.vue` - Main settings page
- Components:
  - `ProviderCard.vue` - AI provider selection cards
  - `ApiKeyInput.vue` - Encrypted API key input
  - `ModelSelector.vue` - Model selection dropdown
  - `TestConnection.vue` - Connection testing
  - `UsageDashboard.vue` - Analytics visualization

### 7. Configuration
Add to `packages/@n8n/config/src/configs/`:
- GHL configuration schema
- Environment variables:
  - `N8N_GHL_MASTER_ENCRYPTION_KEY` - 32-byte hex key for API encryption
  - `N8N_GHL_WEBHOOK_BASE_URL` - Public URL for webhooks

### 8. Seed Data
Create script to populate `ghl_available_models` table with:
- OpenAI models (GPT-4 Turbo, GPT-3.5, GPT-4o-mini)
- Anthropic models (Claude 3.5 Sonnet, Opus, Haiku)
- Groq models (Llama 3.3 70B, Mixtral)
- Together AI models
- Ollama models

### 9. MCP Tools Integration
Adapt existing n8n workflow tools to work with GHL:
- Contacts (get, create, update, tags, tasks)
- Conversations (search, get messages, send)
- Calendar (events, notes)
- Opportunities (search, pipelines, update)
- Payments (orders, transactions)
- Social Media (posts, statistics)

### 10. Voice Support (Optional)
- Groq Whisper transcription integration
- Convert voice messages to text before AI processing

### 11. Testing
- Unit tests for all services
- Integration tests for webhook flow
- E2E tests for full conversation flow

### 12. Documentation
- API documentation for client integration
- Setup guide for GHL marketplace app
- OAuth 2.0 configuration guide
- Deployment instructions

## Environment Setup

```bash
# Generate encryption key (run once)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
N8N_GHL_MASTER_ENCRYPTION_KEY=<64-hex-characters>
N8N_GHL_WEBHOOK_BASE_URL=https://your-n8n-instance.com
```

## Database Migration

```bash
# Apply migrations
pnpm --filter @n8n/cli db:migrate

# Or specific database
pnpm --filter @n8n/cli db:migrate -- --type=postgresdb
```

## Security Considerations

1. **API Key Encryption**: All AI provider API keys are encrypted with AES-256-GCM
2. **Master Key Management**: Store `N8N_GHL_MASTER_ENCRYPTION_KEY` in secure key vault
3. **Multi-tenancy**: Each GHL location (client) has isolated data
4. **Webhook Validation**: Verify GHL webhook signatures
5. **Rate Limiting**: Implement per-client rate limits

## Cost Tracking

The system tracks:
- Input tokens
- Output tokens
- Total tokens
- Cost in USD (calculated from model pricing)
- Request duration
- Errors

This data is stored in `ghl_usage_logs` for analytics and billing.

## Next Steps

1. Implement repositories with TypeORM
2. Create AI provider factory with OpenAI as first provider
3. Implement webhook controller for GHL message events
4. Create conversation service with memory management
5. Build frontend settings UI
6. Add GHL OAuth 2.0 flow for app installation
7. Implement usage tracking and analytics
8. Add comprehensive testing
9. Deploy and configure GHL marketplace app

## References

- [GoHighLevel API Docs](https://highlevel.stoplight.io/docs/integrations/)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Anthropic API](https://docs.anthropic.com/claude/reference)
- [Groq API](https://console.groq.com/docs)
- [n8n MCP Documentation](internal)

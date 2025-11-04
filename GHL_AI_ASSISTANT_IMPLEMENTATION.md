# GoHighLevel AI Assistant Implementation

## Overview
This document describes the implementation of the GoHighLevel AI Assistant feature - a multi-tenant SaaS capability that integrates AI-powered assistant functionality with the GoHighLevel (GHL) platform using a BYOK (Bring Your Own Key) model.

## Branch
`feat-ghl-ai-assistant-byok-multitenant-webhooks-conversations`

## What Has Been Implemented ✅

### 1. Database Schema & Entities

Created 6 new database entities in `packages/@n8n/db/src/entities/`:

#### `ghl-client.entity.ts`
- Multi-tenant client management
- Fields: `id`, `ghlLocationId`, `companyName`, `subscriptionTier`, `isActive`, `settings`
- Relationships: One-to-many with AI providers and conversation sessions

#### `ghl-ai-provider.entity.ts`
- Stores encrypted API keys for AI providers (OpenAI, Anthropic, Groq, Together AI, Ollama)
- Fields: `id`, `clientId`, `providerType`, `apiKeyEncrypted`, `encryptionIv`, `encryptionTag`, `modelConfig`, `isActive`, `priority`, `lastUsedAt`
- **Security**: All API keys are encrypted with AES-256-GCM
- Unique constraint on `(clientId, providerType)` - one provider per client

#### `ghl-conversation-session.entity.ts`
- Manages conversation context and memory for AI interactions
- Fields: `id`, `clientId`, `ghlConversationId`, `ghlContactId`, `context` (JSON array of messages), `metadata`, `lastMessageAt`
- Stores conversation history with role (user/assistant/system), content, and timestamps

#### `ghl-available-model.entity.ts`
- Catalog of supported AI models across all providers
- Fields: `id`, `providerType`, `modelId`, `displayName`, `description`, `capabilities`, `pricing`, `contextWindow`, `maxOutputTokens`, `isActive`
- Allows dynamic model selection and pricing display

#### `ghl-usage-log.entity.ts`
- Analytics and cost tracking for AI usage
- Fields: `id`, `clientId`, `sessionId`, `providerType`, `modelUsed`, `tokensInput`, `tokensOutput`, `tokensTotal`, `costUsd`, `requestDurationMs`, `errorMessage`
- Enables billing and usage reports

#### `ghl-webhook-log.entity.ts`
- Debugging and audit trail for GHL webhook events
- Fields: `id`, `clientId`, `eventType`, `payload` (JSON), `responseStatus`, `errorMessage`

### 2. Database Migrations

Created migration `packages/@n8n/db/src/migrations/common/1762256012783-CreateGhlTables.ts`:
- Uses n8n's schema builder DSL
- Cross-database compatible (PostgreSQL, MySQL, SQLite)
- Creates all 6 tables with proper foreign keys and indexes
- Registered in all database migration index files

**Key Indexes:**
- `ghl_clients.ghlLocationId` (unique)
- `ghl_ai_providers(clientId, providerType)` (unique)
- `ghl_conversation_sessions(clientId, ghlConversationId)` (unique)
- `ghl_available_models(providerType, modelId)` (unique)
- `ghl_usage_logs(clientId, createdAt)` (for analytics queries)

### 3. Configuration

Created `packages/@n8n/config/src/configs/ghl.config.ts`:

```typescript
@Config
export class GhlConfig {
  @Env('N8N_GHL_MASTER_ENCRYPTION_KEY', hex64Schema)
  masterEncryptionKey: string = '';

  @Env('N8N_GHL_WEBHOOK_BASE_URL')
  webhookBaseUrl: string = '';

  @Env('N8N_GHL_AI_ASSISTANT_ENABLED')
  enabled: boolean = true;
}
```

Integrated into `GlobalConfig` in `packages/@n8n/config/src/index.ts`.

### 4. Encryption Service

Created `packages/cli/src/modules/ghl-ai-assistant/encryption.service.ts`:

**Features:**
- AES-256-GCM encryption algorithm
- Uses `N8N_GHL_MASTER_ENCRYPTION_KEY` (32 bytes as 64 hex characters)
- Generates random IV (Initialization Vector) for each encryption
- Includes authentication tag for integrity verification
- Static method to generate new encryption keys

**Usage:**
```typescript
const encrypted = encryptionService.encrypt('sk-proj-abc123...');
// Returns: { encrypted, iv, tag }

const apiKey = encryptionService.decrypt(encrypted);
// Returns: 'sk-proj-abc123...'
```

### 5. TypeScript Types

Created `packages/cli/src/modules/ghl-ai-assistant/ai-provider/types.ts`:

```typescript
interface Message { role, content }
interface ChatOptions { temperature, maxTokens, ... }
interface ChatResponse { content, usage, model }
interface AIProvider { chat(), streamChat() }
interface ProviderConfig { provider, apiKey, model, ... }
```

### 6. Documentation

Created comprehensive `packages/cli/src/modules/ghl-ai-assistant/README.md` documenting:
- Architecture overview
- Implementation status
- What still needs to be done
- Security considerations
- Cost tracking features
- Environment setup guide
- Database migration instructions

## Architecture

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

## What Still Needs To Be Implemented ⏳

### High Priority (Core Functionality)

1. **Repositories** (`packages/@n8n/db/src/repositories/`)
   - `ghl-client.repository.ts` - CRUD operations for clients
   - `ghl-ai-provider.repository.ts` - Provider config management
   - `ghl-conversation-session.repository.ts` - Session/memory management
   - Export in `packages/@n8n/db/src/repositories/index.ts`

2. **AI Provider Implementations** (`packages/cli/src/modules/ghl-ai-assistant/ai-provider/providers/`)
   - `openai.provider.ts` - OpenAI GPT models
   - `anthropic.provider.ts` - Claude models
   - `groq.provider.ts` - Ultra-fast Llama/Mixtral
   - `together.provider.ts` - Affordable models
   - `ollama.provider.ts` - Self-hosted models
   - `factory.ts` - Factory pattern for provider instantiation

3. **Core Services** (`packages/cli/src/modules/ghl-ai-assistant/`)
   - `ghl-client.service.ts` - Client lifecycle management
   - `ghl-conversation.service.ts` - Conversation handling & memory
   - `ghl-webhook.service.ts` - Webhook processing & validation
   - `ghl-usage-tracking.service.ts` - Analytics & cost calculation

4. **Controllers** (`packages/cli/src/controllers/`)
   - `ghl-webhook.controller.ts` - Receive GHL webhooks
   - `ghl-settings.controller.ts` - Client configuration API
   - `ghl-ai-provider.controller.ts` - Provider management API
   - Register in `packages/cli/src/controller.registry.ts`

5. **GHL OAuth 2.0 & SSO**
   - OAuth flow for GHL marketplace app installation
   - Store access tokens securely
   - Handle token refresh
   - Location-to-client mapping

### Medium Priority (Enhanced Features)

6. **Enhanced HighLevel Nodes** (`packages/nodes-base/nodes/HighLevel/`)
   - Add Conversation resource (v3 or new version)
   - Message sending/receiving operations
   - Conversation search and context retrieval
   - Integration with AI agent

7. **Frontend Settings UI** (`packages/frontend/editor-ui/src/`)
   - Provider selection cards (OpenAI, Anthropic, etc.)
   - Encrypted API key input with show/hide
   - Model selection with pricing display
   - Connection testing
   - Usage analytics dashboard

8. **Seed Data & Setup**
   - Script to populate `ghl_available_models` table
   - Model pricing data (keep updated)
   - Setup wizard for initial configuration

9. **MCP Tools Integration**
   - Adapt existing GHL API tools to work with AI agent
   - Contacts, Conversations, Calendar, Opportunities, etc.
   - Tool usage tracking

### Low Priority (Nice-to-Have)

10. **Voice Support**
    - Groq Whisper transcription for voice messages
    - Audio to text conversion before AI processing

11. **Advanced Features**
    - Multi-model failover (primary → secondary providers)
    - Rate limiting per client
    - Custom system prompts per client
    - A/B testing of different models
    - Conversation analytics (sentiment, topics, etc.)

12. **Testing**
    - Unit tests for all services
    - Integration tests for webhook flow
    - E2E tests for conversation flow
    - Load testing for concurrent conversations

13. **Documentation**
    - API documentation (OpenAPI/Swagger)
    - GHL marketplace app setup guide
    - OAuth configuration tutorial
    - Deployment guide

## Environment Variables

```bash
# Required - 32 bytes as 64 hex characters
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
N8N_GHL_MASTER_ENCRYPTION_KEY=abcd1234...

# Required - Public URL for GHL to send webhooks
N8N_GHL_WEBHOOK_BASE_URL=https://your-n8n-instance.com

# Optional - Enable/disable the module
N8N_GHL_AI_ASSISTANT_ENABLED=true
```

## Security Features

1. **API Key Encryption**: All AI provider API keys stored with AES-256-GCM
2. **Multi-tenancy**: Complete data isolation per GHL location
3. **Webhook Validation**: Verify GHL webhook signatures (TODO)
4. **Master Key Management**: Store `N8N_GHL_MASTER_ENCRYPTION_KEY` in secure vault
5. **Audit Logs**: Track all webhook events and errors

## Cost Tracking

The system calculates and stores:
- Input tokens (prompt)
- Output tokens (completion)
- Total tokens
- Cost in USD (using current model pricing)
- Request duration
- Errors encountered

Enables:
- Client billing
- Usage reports
- Cost optimization insights
- Model performance comparison

## Database Migration

```bash
# Apply migrations
cd /home/engine/project
pnpm --filter @n8n/db migrate

# Check status
pnpm --filter @n8n/db migration:show
```

## Next Steps for Development

1. **Implement Repositories** - Start with `GhlClientRepository`
2. **Create OpenAI Provider** - Get basic chat working
3. **Build Webhook Controller** - Receive GHL conversation events
4. **Implement Conversation Service** - Handle message flow with memory
5. **Add Usage Tracking** - Log tokens and calculate costs
6. **Test End-to-End** - Full conversation flow with real GHL location
7. **Build Frontend UI** - Allow clients to configure their AI provider
8. **OAuth Integration** - Handle GHL marketplace app installation
9. **Deploy & Test** - Set up staging environment with real GHL instance
10. **Seed Model Data** - Populate available models table

## Supported AI Providers & Models

### OpenAI
- GPT-4 Turbo ($0.01 input / $0.03 output per 1K tokens)
- GPT-4 ($0.03 / $0.06)
- GPT-4o-mini ($0.00015 / $0.0006)
- GPT-3.5 Turbo ($0.0005 / $0.0015)

### Anthropic
- Claude 3.5 Sonnet ($0.003 / $0.015)
- Claude 3 Opus ($0.015 / $0.075)
- Claude 3 Haiku ($0.00025 / $0.00125)

### Groq (Ultra Fast)
- Llama 3.3 70B ($0.00059 / $0.00079)
- Mixtral 8x7B ($0.00024 / $0.00024)

### Together AI (Affordable)
- Llama 3.1 70B ($0.00088 / $0.00088)
- Mixtral 8x22B ($0.0006 / $0.0006)

### Ollama (Self-Hosted)
- Llama 3.2 (FREE)
- Mistral 7B (FREE)

## References

- [GoHighLevel API](https://highlevel.stoplight.io/docs/integrations/)
- [GoHighLevel OAuth Guide](https://highlevel.stoplight.io/docs/integrations/0443d7d1a4bd0-get-access-token)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Anthropic API](https://docs.anthropic.com/claude/reference)
- [Groq API](https://console.groq.com/docs)
- [n8n Architecture](https://docs.n8n.io/hosting/architecture/)

## File Structure

```
packages/
├── @n8n/
│   ├── config/
│   │   └── src/
│   │       ├── configs/
│   │       │   └── ghl.config.ts ✅
│   │       └── index.ts (updated) ✅
│   └── db/
│       └── src/
│           ├── entities/
│           │   ├── ghl-client.entity.ts ✅
│           │   ├── ghl-ai-provider.entity.ts ✅
│           │   ├── ghl-conversation-session.entity.ts ✅
│           │   ├── ghl-available-model.entity.ts ✅
│           │   ├── ghl-usage-log.entity.ts ✅
│           │   ├── ghl-webhook-log.entity.ts ✅
│           │   └── index.ts (updated) ✅
│           ├── migrations/
│           │   ├── common/
│           │   │   └── 1762256012783-CreateGhlTables.ts ✅
│           │   ├── postgresdb/
│           │   │   └── index.ts (updated) ✅
│           │   ├── mysqldb/
│           │   │   └── index.ts (updated) ✅
│           │   └── sqlite/
│           │       └── index.ts (updated) ✅
│           └── repositories/
│               ├── ghl-client.repository.ts ⏳
│               ├── ghl-ai-provider.repository.ts ⏳
│               └── ... (other GHL repositories) ⏳
└── cli/
    └── src/
        ├── controllers/
        │   ├── ghl-webhook.controller.ts ⏳
        │   ├── ghl-settings.controller.ts ⏳
        │   └── ghl-ai-provider.controller.ts ⏳
        └── modules/
            └── ghl-ai-assistant/
                ├── README.md ✅
                ├── encryption.service.ts ✅
                ├── ghl-client.service.ts ⏳
                ├── ghl-conversation.service.ts ⏳
                ├── ghl-webhook.service.ts ⏳
                ├── ghl-usage-tracking.service.ts ⏳
                └── ai-provider/
                    ├── types.ts ✅
                    ├── factory.ts ⏳
                    └── providers/
                        ├── openai.provider.ts ⏳
                        ├── anthropic.provider.ts ⏳
                        ├── groq.provider.ts ⏳
                        ├── together.provider.ts ⏳
                        └── ollama.provider.ts ⏳
```

## Conclusion

This implementation provides a solid foundation for the GoHighLevel AI Assistant feature. The database schema is complete, migrations are in place, and the core security layer (encryption) is implemented. The next priority is to implement the repositories and AI provider factory to enable basic AI chat functionality through GHL webhooks.

The architecture follows n8n's patterns (DI, services, controllers) and maintains multi-tenant security with encrypted API keys. The system is designed to scale horizontally and supports multiple AI providers with client-provided API keys (BYOK model).

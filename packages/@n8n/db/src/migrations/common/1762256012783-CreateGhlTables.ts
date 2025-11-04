import type { MigrationContext, ReversibleMigration } from '../migration-types';

const tables = {
	clients: 'ghl_clients',
	availableModels: 'ghl_available_models',
	aiProviders: 'ghl_ai_providers',
	conversationSessions: 'ghl_conversation_sessions',
	usageLogs: 'ghl_usage_logs',
	webhookLogs: 'ghl_webhook_logs',
} as const;

export class CreateGhlTables1762256012783 implements ReversibleMigration {
	async up({ schemaBuilder: { createTable, column } }: MigrationContext) {
		// Create ghl_clients table
		await createTable(tables.clients)
			.withColumns(
				column('id').varchar(255).primary.notNull,
				column('ghlLocationId').varchar(255).notNull,
				column('companyName').varchar(255),
				column('subscriptionTier').varchar(50).default("'starter'"),
				column('isActive').boolean.default(true),
				column('settings').json.default("'{}'"),
			)
			.withTimestamps.withIndexOn('ghlLocationId', true);

		// Create ghl_available_models table
		await createTable(tables.availableModels)
			.withColumns(
				column('id').varchar(255).primary.notNull,
				column('providerType').varchar(50).notNull,
				column('modelId').varchar(100).notNull,
				column('displayName').varchar(255),
				column('description').text,
				column('capabilities').json,
				column('pricing').json,
				column('contextWindow').int,
				column('maxOutputTokens').int,
				column('isActive').boolean.default(true),
			)
			.withTimestamps.withIndexOn(['providerType', 'modelId'], true);

		// Create ghl_ai_providers table
		await createTable(tables.aiProviders)
			.withColumns(
				column('id').varchar(255).primary.notNull,
				column('clientId').varchar(255).notNull,
				column('providerType').varchar(50).notNull,
				column('apiKeyEncrypted').text.notNull,
				column('encryptionIv').varchar(255).notNull,
				column('encryptionTag').varchar(255).notNull,
				column('modelConfig').json.notNull,
				column('isActive').boolean.default(true),
				column('priority').int.default(0),
				column('lastUsedAt').timestampTimezone(),
			)
			.withTimestamps.withForeignKey('clientId', {
				tableName: tables.clients,
				columnName: 'id',
				onDelete: 'CASCADE',
			})
			.withIndexOn('clientId')
			.withIndexOn(['clientId', 'providerType'], true);

		// Create ghl_conversation_sessions table
		await createTable(tables.conversationSessions)
			.withColumns(
				column('id').varchar(255).primary.notNull,
				column('clientId').varchar(255).notNull,
				column('ghlConversationId').varchar(255).notNull,
				column('ghlContactId').varchar(255),
				column('context').json.default("'[]'"),
				column('metadata').json.default("'{}'"),
				column('lastMessageAt').timestampTimezone().notNull.default('CURRENT_TIMESTAMP'),
			)
			.withTimestamps.withForeignKey('clientId', {
				tableName: tables.clients,
				columnName: 'id',
				onDelete: 'CASCADE',
			})
			.withIndexOn('clientId')
			.withIndexOn('ghlConversationId')
			.withIndexOn(['clientId', 'ghlConversationId'], true);

		// Create ghl_usage_logs table
		await createTable(tables.usageLogs)
			.withColumns(
				column('id').varchar(255).primary.notNull,
				column('clientId').varchar(255).notNull,
				column('sessionId').varchar(255),
				column('providerType').varchar(50),
				column('modelUsed').varchar(100),
				column('tokensInput').int,
				column('tokensOutput').int,
				column('tokensTotal').int,
				column('costUsd').decimal(10, 6),
				column('requestDurationMs').int,
				column('errorMessage').text,
			)
			.withTimestamps.withForeignKey('clientId', {
				tableName: tables.clients,
				columnName: 'id',
				onDelete: 'CASCADE',
			})
			.withForeignKey('sessionId', {
				tableName: tables.conversationSessions,
				columnName: 'id',
				onDelete: 'SET NULL',
			})
			.withIndexOn(['clientId', 'createdAt']);

		// Create ghl_webhook_logs table
		await createTable(tables.webhookLogs)
			.withColumns(
				column('id').varchar(255).primary.notNull,
				column('clientId').varchar(255),
				column('eventType').varchar(100),
				column('payload').json,
				column('responseStatus').int,
				column('errorMessage').text,
			)
			.withTimestamps.withForeignKey('clientId', {
				tableName: tables.clients,
				columnName: 'id',
				onDelete: 'SET NULL',
			})
			.withIndexOn('createdAt');
	}

	async down({ schemaBuilder: { dropTable } }: MigrationContext) {
		await dropTable(tables.webhookLogs);
		await dropTable(tables.usageLogs);
		await dropTable(tables.conversationSessions);
		await dropTable(tables.aiProviders);
		await dropTable(tables.availableModels);
		await dropTable(tables.clients);
	}
}

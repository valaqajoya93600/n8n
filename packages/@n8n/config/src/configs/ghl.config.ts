import { z } from 'zod';

import { Config, Env } from '../decorators';

const hex64Schema = z
	.string()
	.regex(/^[a-f0-9]{64}$/i, 'Must be a 64-character hex string representing 32 bytes');

@Config
export class GhlConfig {
	/**
	 * Master encryption key used to encrypt AI provider API keys (hex string, 32 bytes)
	 */
	@Env('N8N_GHL_MASTER_ENCRYPTION_KEY', hex64Schema)
	masterEncryptionKey: string = '';

	/**
	 * Public base URL to receive GoHighLevel webhooks
	 */
	@Env('N8N_GHL_WEBHOOK_BASE_URL')
	webhookBaseUrl: string = '';

	/**
	 * Optional flag to enable/disable the GHL AI assistant module
	 */
	@Env('N8N_GHL_AI_ASSISTANT_ENABLED')
	enabled: boolean = true;
}

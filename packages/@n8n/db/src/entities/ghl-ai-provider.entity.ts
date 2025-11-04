import { Column, Entity, Index, JoinColumn, ManyToOne } from '@n8n/typeorm';

import { DateTimeColumn, JsonColumn, WithTimestampsAndStringId } from './abstract-entity';
import { GhlClient } from './ghl-client.entity';

@Entity({ name: 'ghl_ai_providers' })
@Index(['clientId', 'providerType'], { unique: true })
export class GhlAiProvider extends WithTimestampsAndStringId {
	@Column({ name: 'client_id' })
	clientId: string;

	@ManyToOne(() => GhlClient, (client) => client.aiProviders, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'client_id' })
	client: GhlClient;

	@Column({ name: 'provider_type', length: 50 })
	providerType: string;

	@Column({ name: 'api_key_encrypted', type: 'text' })
	apiKeyEncrypted: string;

	@Column({ name: 'encryption_iv', length: 255 })
	encryptionIv: string;

	@Column({ name: 'encryption_tag', length: 255 })
	encryptionTag: string;

	@JsonColumn({ name: 'model_config' })
	modelConfig: {
		chatModel: string;
		temperature?: number;
		maxTokens?: number;
		topP?: number;
		frequencyPenalty?: number;
		presencePenalty?: number;
		[key: string]: unknown;
	};

	@Column({ name: 'is_active', default: true })
	isActive: boolean;

	@Column({ name: 'priority', default: 0 })
	priority: number;

	@DateTimeColumn({ name: 'last_used_at', nullable: true })
	lastUsedAt?: Date;
}

import { Column, Entity, Index, OneToMany } from '@n8n/typeorm';

import { JsonColumn, WithTimestampsAndStringId } from './abstract-entity';
import { GhlAiProvider } from './ghl-ai-provider.entity';
import { GhlConversationSession } from './ghl-conversation-session.entity';

@Entity({ name: 'ghl_clients' })
@Index(['ghlLocationId'], { unique: true })
export class GhlClient extends WithTimestampsAndStringId {
	@Column({ length: 255, name: 'ghl_location_id' })
	ghlLocationId: string;

	@Column({ length: 255, nullable: true, name: 'company_name' })
	companyName?: string;

	@Column({ length: 50, default: 'starter', name: 'subscription_tier' })
	subscriptionTier: string;

	@Column({ default: true, name: 'is_active' })
	isActive: boolean;

	@JsonColumn({ default: {} })
	settings: {
		maxTokens?: number;
		temperature?: number;
		memoryWindow?: number;
		voiceEnabled?: boolean;
		[key: string]: unknown;
	};

	@OneToMany(() => GhlAiProvider, (provider) => provider.client)
	aiProviders: GhlAiProvider[];

	@OneToMany(() => GhlConversationSession, (session) => session.client)
	conversationSessions: GhlConversationSession[];
}

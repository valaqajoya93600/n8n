import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from '@n8n/typeorm';

import { DateTimeColumn, JsonColumn, WithTimestampsAndStringId } from './abstract-entity';
import { GhlClient } from './ghl-client.entity';
import { GhlUsageLog } from './ghl-usage-log.entity';

@Entity({ name: 'ghl_conversation_sessions' })
@Index(['clientId', 'ghlConversationId'], { unique: true })
export class GhlConversationSession extends WithTimestampsAndStringId {
	@Column({ name: 'client_id' })
	clientId: string;

	@ManyToOne(() => GhlClient, (client) => client.conversationSessions, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'client_id' })
	client: GhlClient;

	@Column({ name: 'ghl_conversation_id', length: 255 })
	ghlConversationId: string;

	@Column({ name: 'ghl_contact_id', length: 255, nullable: true })
	ghlContactId?: string;

	@JsonColumn({ default: [] })
	context: Array<{
		role: 'user' | 'assistant' | 'system';
		content: string;
		timestamp: string;
	}>;

	@JsonColumn({ default: {} })
	metadata: {
		contactName?: string;
		contactEmail?: string;
		contactPhone?: string;
		[key: string]: unknown;
	};

	@DateTimeColumn({ name: 'last_message_at' })
	lastMessageAt: Date;

	@OneToMany(() => GhlUsageLog, (log) => log.session)
	usageLogs: GhlUsageLog[];
}

import { Column, Entity, Index, JoinColumn, ManyToOne } from '@n8n/typeorm';

import { WithTimestampsAndStringId } from './abstract-entity';
import { GhlClient } from './ghl-client.entity';
import { GhlConversationSession } from './ghl-conversation-session.entity';

@Entity({ name: 'ghl_usage_logs' })
@Index(['clientId', 'createdAt'])
export class GhlUsageLog extends WithTimestampsAndStringId {
	@Column({ name: 'client_id' })
	clientId: string;

	@ManyToOne(() => GhlClient, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'client_id' })
	client: GhlClient;

	@Column({ name: 'session_id', nullable: true })
	sessionId?: string;

	@ManyToOne(() => GhlConversationSession, (session) => session.usageLogs, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'session_id' })
	session?: GhlConversationSession;

	@Column({ name: 'provider_type', length: 50, nullable: true })
	providerType?: string;

	@Column({ name: 'model_used', length: 100, nullable: true })
	modelUsed?: string;

	@Column({ name: 'tokens_input', nullable: true, type: 'int' })
	tokensInput?: number;

	@Column({ name: 'tokens_output', nullable: true, type: 'int' })
	tokensOutput?: number;

	@Column({ name: 'tokens_total', nullable: true, type: 'int' })
	tokensTotal?: number;

	@Column({ name: 'cost_usd', nullable: true, type: 'decimal', precision: 10, scale: 6 })
	costUsd?: number;

	@Column({ name: 'request_duration_ms', nullable: true, type: 'int' })
	requestDurationMs?: number;

	@Column({ name: 'error_message', nullable: true, type: 'text' })
	errorMessage?: string;
}

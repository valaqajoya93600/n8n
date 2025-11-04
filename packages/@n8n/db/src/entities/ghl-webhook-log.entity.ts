import { Column, Entity, Index, JoinColumn, ManyToOne } from '@n8n/typeorm';

import { JsonColumn, WithTimestampsAndStringId } from './abstract-entity';
import { GhlClient } from './ghl-client.entity';

@Entity({ name: 'ghl_webhook_logs' })
@Index(['createdAt'])
export class GhlWebhookLog extends WithTimestampsAndStringId {
	@Column({ name: 'client_id', nullable: true })
	clientId?: string;

	@ManyToOne(() => GhlClient, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'client_id' })
	client?: GhlClient;

	@Column({ name: 'event_type', length: 100, nullable: true })
	eventType?: string;

	@JsonColumn({ nullable: true })
	payload?: unknown;

	@Column({ name: 'response_status', nullable: true, type: 'int' })
	responseStatus?: number;

	@Column({ name: 'error_message', nullable: true, type: 'text' })
	errorMessage?: string;
}

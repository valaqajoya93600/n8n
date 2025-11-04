import { Column, Entity, Index } from '@n8n/typeorm';

import { JsonColumn, WithTimestampsAndStringId } from './abstract-entity';

@Entity({ name: 'ghl_available_models' })
@Index(['providerType', 'modelId'], { unique: true })
export class GhlAvailableModel extends WithTimestampsAndStringId {
	@Column({ name: 'provider_type', length: 50 })
	providerType: string;

	@Column({ name: 'model_id', length: 100 })
	modelId: string;

	@Column({ name: 'display_name', length: 255, nullable: true })
	displayName?: string;

	@Column({ type: 'text', nullable: true })
	description?: string;

	@JsonColumn({ nullable: true })
	capabilities?: string[];

	@JsonColumn({ nullable: true })
	pricing?: {
		input?: number;
		output?: number;
		unit?: string;
	};

	@Column({ name: 'context_window', nullable: true, type: 'int' })
	contextWindow?: number;

	@Column({ name: 'max_output_tokens', nullable: true, type: 'int' })
	maxOutputTokens?: number;

	@Column({ name: 'is_active', default: true })
	isActive: boolean;
}

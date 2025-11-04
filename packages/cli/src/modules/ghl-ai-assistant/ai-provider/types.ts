export interface Message {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

export interface ChatOptions {
	temperature?: number;
	maxTokens?: number;
	topP?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
}

export interface ChatResponse {
	content: string;
	usage?: {
		inputTokens: number;
		outputTokens: number;
		totalTokens: number;
	};
	model: string;
}

export interface AIProvider {
	chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
	streamChat(
		messages: Message[],
		onChunk: (chunk: string) => void,
		options?: ChatOptions,
	): Promise<void>;
}

export interface ProviderConfig {
	provider: 'openai' | 'anthropic' | 'groq' | 'together' | 'ollama';
	apiKey: string;
	model: string;
	temperature?: number;
	maxTokens?: number;
	topP?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
}

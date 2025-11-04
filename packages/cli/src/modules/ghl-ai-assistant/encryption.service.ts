import crypto from 'node:crypto';

import { GlobalConfig } from '@n8n/config';
import { Service } from '@n8n/di';

export interface EncryptedData {
    encrypted: string;
    iv: string;
    tag: string;
}

@Service()
export class EncryptionService {
    private readonly algorithm = 'aes-256-gcm';

    private readonly encryptionKey: string;

    constructor(private readonly globalConfig: GlobalConfig) {
        this.encryptionKey = this.globalConfig.ghl.masterEncryptionKey;

        if (!this.encryptionKey || this.encryptionKey.length !== 64) {
            throw new Error(
                'N8N_GHL_MASTER_ENCRYPTION_KEY must be set in environment and be exactly 64 hex characters (32 bytes)',
            );
        }
    }

    /**
     * Encrypt a plaintext string (e.g., API key) using AES-256-GCM
     */
    encrypt(plaintext: string): EncryptedData {
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv(
            this.algorithm,
            Buffer.from(this.encryptionKey, 'hex'),
            iv,
        );

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const tag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex'),
        };
    }

    /**
     * Decrypt an encrypted string back to plaintext
     */
    decrypt(data: EncryptedData): string {
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            Buffer.from(this.encryptionKey, 'hex'),
            Buffer.from(data.iv, 'hex'),
        );

        decipher.setAuthTag(Buffer.from(data.tag, 'hex'));

        let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Generate a new encryption key (for setup)
     */
    static generateKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }
}

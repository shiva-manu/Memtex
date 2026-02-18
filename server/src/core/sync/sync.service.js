import prisma from "../../db/prisma.js";
import { enqueueSummarize } from "../../jobs/producers/memory.producer.js";

// ─── Valid providers ─────────────────────────────────────────────
const VALID_PROVIDERS = ["chatgpt", "gemini", "claude"];

/**
 * Get the correct Prisma model for a given provider
 */
function getConversationModel(provider) {
    switch (provider) {
        case "chatgpt":
            return prisma.chatgptConversation;
        case "gemini":
            return prisma.geminiConversation;
        case "claude":
            return prisma.claudeConversation;
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

// getMessageModel is removed as we now use JSON blobs in the conversation table

/**
 * Register a provider sync for a user
 */
export async function registerSync(userId, provider) {
    if (!VALID_PROVIDERS.includes(provider)) {
        throw new Error(`Invalid provider: ${provider}. Must be one of: ${VALID_PROVIDERS.join(", ")}`);
    }

    return prisma.syncProvider.upsert({
        where: {
            userId_provider: { userId, provider }
        },
        update: {
            lastSyncAt: new Date(),
            isActive: true
        },
        create: {
            userId,
            provider,
            isActive: true
        }
    });
}

/**
 * Get all synced providers for a user
 */
export async function getUserSyncedProviders(userId) {
    return prisma.syncProvider.findMany({
        where: { userId, isActive: true },
        orderBy: { syncedAt: "desc" }
    });
}

/**
 * Sync a single conversation from a specific provider
 * This stores the chat in the provider-specific table,
 * then enqueues it for summarization + vectorization.
 */
export async function syncConversation({ userId, provider, title, externalId, messages }) {
    if (!VALID_PROVIDERS.includes(provider)) {
        throw new Error(`Invalid provider: ${provider}`);
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw new Error("Messages array is required and cannot be empty");
    }

    const conversationModel = getConversationModel(provider);

    // 1. Check for existing conversation with the same externalId to avoid duplicates
    if (externalId) {
        const existing = await conversationModel.findUnique({
            where: { externalId }
        });

        if (existing) {
            console.log(`[Sync] Conversation ${externalId} already exists. Skipping duplication.`);
            return existing;
        }
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
        // 1. Create conversation in provider-specific table with messages as JSON
        const conversation = await getConversationModelFromTx(tx, provider).create({
            data: {
                userId,
                externalId,
                title: title || `${provider} Sync`,
                messages: messages, // Stored as JSON blob
                imported: true
            }
        });

        return conversation;
    });

    // 3. Register/update sync provider record
    await registerSync(userId, provider);

    // 4. Enqueue for summarization + vectorization (with provider metadata)
    await enqueueSummarize({
        conversationId: result.id,
        userId,
        provider
    });

    return result;
}

/**
 * Sync multiple conversations at once (batch import)
 */
export async function syncBatchConversations({ userId, provider, conversations }) {
    if (!VALID_PROVIDERS.includes(provider)) {
        throw new Error(`Invalid provider: ${provider}`);
    }

    const results = [];

    for (const convo of conversations) {
        try {
            const result = await syncConversation({
                userId,
                provider,
                title: convo.title,
                externalId: convo.id || convo.externalId,
                messages: convo.messages
            });
            results.push({ success: true, conversationId: result.id, title: convo.title });
        } catch (err) {
            results.push({ success: false, title: convo.title, error: err.message });
        }
    }

    return results;
}

/**
 * Get conversations for a specific provider for a user
 */
export async function getProviderConversations(userId, provider, { limit = 20, offset = 0 } = {}) {
    if (!VALID_PROVIDERS.includes(provider)) {
        throw new Error(`Invalid provider: ${provider}`);
    }

    const model = getConversationModel(provider);

    return model.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset
    });
}

/**
 * Get all conversations across all synced providers for a user
 */
export async function getAllProviderConversations(userId, { limit = 20 } = {}) {
    const syncedProviders = await getUserSyncedProviders(userId);

    const allConversations = {};

    for (const sp of syncedProviders) {
        const convos = await getProviderConversations(userId, sp.provider, { limit });
        allConversations[sp.provider] = convos;
    }

    return allConversations;
}

/**
 * Remove a provider sync (soft delete)
 */
export async function removeSync(userId, provider) {
    return prisma.syncProvider.update({
        where: {
            userId_provider: { userId, provider }
        },
        data: { isActive: false }
    });
}

// ─── Transaction-aware model helpers ────────────────────────────
function getConversationModelFromTx(tx, provider) {
    switch (provider) {
        case "chatgpt":
            return tx.chatgptConversation;
        case "gemini":
            return tx.geminiConversation;
        case "claude":
            return tx.claudeConversation;
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

// getMessageModelFromTx removed

export { VALID_PROVIDERS };

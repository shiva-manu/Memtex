import {
    syncConversation,
    syncBatchConversations,
    getProviderConversations,
    getAllProviderConversations,
    getUserSyncedProviders,
    removeSync,
    VALID_PROVIDERS
} from "../../core/sync/sync.service.js";

/**
 * POST /api/sync/:provider
 * Sync a single conversation from a specific provider
 * Body: { title: string, messages: [{ role, content }] }
 */
export async function syncSingleConversation(req, res) {
    try {
        const { provider } = req.params;
        const { title, messages, id, externalId } = req.body;

        if (!VALID_PROVIDERS.includes(provider)) {
            return res.status(400).json({
                error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(", ")}`
            });
        }

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: "Messages array is required" });
        }

        const result = await syncConversation({
            userId: req.user.id,
            provider,
            title,
            externalId: id || externalId,
            messages
        });

        res.json({
            success: true,
            conversationId: result.id,
            provider
        });
    } catch (err) {
        console.error("Sync error:", err);
        res.status(500).json({ error: "Failed to sync conversation" });
    }
}

/**
 * POST /api/sync/:provider/batch
 * Sync multiple conversations from a specific provider
 * Body: { conversations: [{ title, messages: [{ role, content }] }] }
 */
export async function syncBatch(req, res) {
    try {
        const { provider } = req.params;
        const { conversations } = req.body;

        if (!VALID_PROVIDERS.includes(provider)) {
            return res.status(400).json({
                error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(", ")}`
            });
        }

        if (!conversations || !Array.isArray(conversations) || conversations.length === 0) {
            return res.status(400).json({ error: "Conversations array is required" });
        }

        const results = await syncBatchConversations({
            userId: req.user.id,
            provider,
            conversations
        });

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        res.json({
            success: true,
            provider,
            total: conversations.length,
            synced: successCount,
            failed: failCount,
            results
        });
    } catch (err) {
        console.error("Batch sync error:", err);
        res.status(500).json({ error: "Failed to sync conversations" });
    }
}

/**
 * GET /api/sync/providers
 * Get all synced providers for the current user
 */
export async function getSyncedProviders(req, res) {
    try {
        const providers = await getUserSyncedProviders(req.user.id);
        res.json({ providers });
    } catch (err) {
        console.error("Get providers error:", err);
        res.status(500).json({ error: "Failed to get providers" });
    }
}

/**
 * GET /api/sync/:provider/conversations
 * Get conversations for a specific provider
 */
export async function getConversationsByProvider(req, res) {
    try {
        const { provider } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        if (!VALID_PROVIDERS.includes(provider)) {
            return res.status(400).json({
                error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(", ")}`
            });
        }

        const conversations = await getProviderConversations(
            req.user.id,
            provider,
            { limit: parseInt(limit), offset: parseInt(offset) }
        );

        res.json({ provider, conversations });
    } catch (err) {
        console.error("Get conversations error:", err);
        res.status(500).json({ error: "Failed to get conversations" });
    }
}

/**
 * GET /api/sync/conversations/all
 * Get conversations across all synced providers
 */
export async function getAllConversations(req, res) {
    try {
        const { limit = 20 } = req.query;

        const conversations = await getAllProviderConversations(
            req.user.id,
            { limit: parseInt(limit) }
        );

        res.json({ conversations });
    } catch (err) {
        console.error("Get all conversations error:", err);
        res.status(500).json({ error: "Failed to get conversations" });
    }
}

/**
 * DELETE /api/sync/:provider
 * Remove a provider sync (soft delete)
 */
export async function removeSyncProvider(req, res) {
    try {
        const { provider } = req.params;

        if (!VALID_PROVIDERS.includes(provider)) {
            return res.status(400).json({
                error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(", ")}`
            });
        }

        await removeSync(req.user.id, provider);

        res.json({ success: true, message: `${provider} sync removed` });
    } catch (err) {
        console.error("Remove sync error:", err);
        res.status(500).json({ error: "Failed to remove sync" });
    }
}

/**
 * Rate Limiting Middleware
 * 
 * Simple in-memory rate limiter for the chat endpoint.
 * Limits: 20 requests per minute per authenticated user.
 * 
 * No external dependencies — uses the existing Node/Express stack.
 */

const rateLimitStore = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now - data.windowStart > 60000) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * Creates a rate limiter with configurable limits.
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Window size in milliseconds
 */
const createRateLimit = (maxRequests = 20, windowMs = 60000) => {
    return (req, res, next) => {
        // Use authenticated user ID as the key
        const userId = req.user?.id || req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const key = `user_${userId}`;
        const now = Date.now();
        const record = rateLimitStore.get(key);

        if (!record || (now - record.windowStart > windowMs)) {
            // New window
            rateLimitStore.set(key, { windowStart: now, count: 1 });
            return next();
        }

        if (record.count >= maxRequests) {
            const retryAfter = Math.ceil((record.windowStart + windowMs - now) / 1000);
            res.set("Retry-After", retryAfter.toString());
            return res.status(429).json({
                message: `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
                retryAfter
            });
        }

        record.count++;
        next();
    };
};

// Default: 20 requests per minute
const chatRateLimit = createRateLimit(20, 60000);

module.exports = { createRateLimit, chatRateLimit };

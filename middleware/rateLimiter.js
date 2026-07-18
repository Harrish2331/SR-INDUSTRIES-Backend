import rateLimit from 'express-rate-limit'

// Limit contact submission requests to prevent denial of service and mailbox spamming
export const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour block window
  max: 5, // Max 5 request instances per IP
  message: {
    success: false,
    message: 'Submission cap exceeded: Limit is 5 inquiries per hour. Please contact G. Rengaraj directly via WhatsApp (+91 86102 35094) for direct support.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

const { logActivity } = require("../services/loggerService");

/**
 * Middleware that captures the response's final status and logs system audit records
 * using values stored in `res.locals.audit`.
 */
const auditMiddleware = (activityType, actionTemplate) => {
  return (req, res, next) => {
    res.on("finish", async () => {
      const audit = res.locals.audit;
      if (!audit) return; // Only log if res.locals.audit is explicitly populated

      const status = res.statusCode >= 400 ? "failed" : "success";
      const action = audit.action || actionTemplate || `${req.method} ${req.originalUrl}`;

      await logActivity({
        req,
        activityType,
        action,
        status,
        targetBook: audit.targetBook || null,
        targetBookTitle: audit.targetBookTitle || "",
        targetUser: audit.targetUser || null,
        targetUserName: audit.targetUserName || "",
        metadata: audit.metadata || {}
      });
    });
    next();
  };
};

module.exports = auditMiddleware;

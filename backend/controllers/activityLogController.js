const ActivityLog = require("../models/ActivityLog");

const listActivityLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      performedBy,
      userRole,
      action,
      activityType,
      status,
      startDate,
      endDate,
      format // "csv", "json"
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { performedByName: { $regex: search, $options: "i" } },
        { action: { $regex: search, $options: "i" } },
        { targetBookTitle: { $regex: search, $options: "i" } },
        { targetUserName: { $regex: search, $options: "i" } }
      ];
    }

    if (performedBy) query.performedBy = performedBy;
    if (userRole) query.userRole = userRole;
    if (action) query.action = action;
    if (activityType) query.activityType = activityType;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Direct export handling
    if (format === "csv") {
      const logs = await ActivityLog.find(query).sort({ createdAt: -1 });
      let csv = "Timestamp,Activity Type,Action,Performed By,Role,Target Book,Target User,Status,IP Address,Browser/Device\n";
      
      logs.forEach((log) => {
        const time = log.createdAt.toISOString();
        const type = `"${(log.activityType || "").replace(/"/g, '""')}"`;
        const act = `"${(log.action || "").replace(/"/g, '""')}"`;
        const by = `"${(log.performedByName || "").replace(/"/g, '""')}"`;
        const role = `"${(log.userRole || "").replace(/"/g, '""')}"`;
        const book = `"${(log.targetBookTitle || "").replace(/"/g, '""')}"`;
        const targetUsr = `"${(log.targetUserName || "").replace(/"/g, '""')}"`;
        const status = log.status;
        const ip = log.ipAddress || "";
        const ua = `"${(log.userAgent || "").replace(/"/g, '""')}"`;

        csv += `${time},${type},${act},${by},${role},${book},${targetUsr},${status},${ip},${ua}\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=activity_logs.csv");
      return res.status(200).send(csv);
    }

    if (format === "json") {
      const logs = await ActivityLog.find(query).sort({ createdAt: -1 });
      res.setHeader("Content-Disposition", "attachment; filename=activity_logs.json");
      return res.json(logs);
    }

    // Paginated results
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments(query)
    ]);

    res.json({
      items: logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { listActivityLogs };

const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");

const logActivity = async ({
  req,
  activityType,
  action,
  status = "success",
  performedBy = null,
  userRole = "System",
  targetBook = null,
  targetBookTitle = "",
  targetUser = null,
  targetUserName = "",
  metadata = {}
}) => {
  try {
    let finalUser = performedBy;
    let finalRole = userRole;
    let ipAddress = "";
    let userAgent = "";

    if (req) {
      if (req.user) {
        finalUser = finalUser || req.user._id || req.user.id;
        finalRole = finalRole || req.user.role;
      }
      ipAddress = req.ip || req.headers["x-forwarded-for"] || "";
      userAgent = req.headers["user-agent"] || "";
    }

    let performedByName = "System";
    if (finalUser) {
      const u = await User.findById(finalUser).select("name");
      if (u) {
        performedByName = u.name;
      }
    }

    await ActivityLog.create({
      activityType,
      action,
      performedBy: finalUser,
      performedByName,
      userRole: finalRole,
      targetBook,
      targetBookTitle,
      targetUser,
      targetUserName,
      status,
      ipAddress,
      userAgent,
      metadata
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

module.exports = { logActivity };

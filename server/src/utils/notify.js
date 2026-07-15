const Notification = require("../models/Notification");

// Single entry point for every notification in the app. Creates the DB
// record (so it shows up in GET /api/notifications / survives refresh)
// and pushes it live to the user's personal socket room (so the bell
// icon updates instantly without polling). Socket push is best-effort —
// if the user isn't connected, io.to() on an empty room is a silent no-op,
// which is exactly the behavior we want.
const notify = async ({ userId, title, message, type = "general", link = "", data = {} }) => {
  const notification = await Notification.create({ userId, title, message, type, link, data });

  try {
    // Required lazily to avoid a circular require at module load time
    // (socketManager -> socket handlers -> notify -> socketManager).
    const { getIO } = require("../socket/socketManager");
    getIO().to(`user:${userId}`).emit("new_notification", notification);
  } catch (err) {
    // Socket.io not initialized yet (e.g. called from a script/test) or
    // user offline — never let a push failure break the calling flow.
    console.error("notify(): live push skipped —", err.message);
  }

  return notification;
};

module.exports = { notify };
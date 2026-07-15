// Notification socket handler.
//
// IMPORTANT: this file used to be an accidental exact duplicate of
// matchmakingSocket.js (copy-paste leftover) — it registered a SECOND
// "join_queue" handler on every connection, meaning every matchmaking
// join fired twice against two separate, unsynced in-memory queues.
// That could silently double-create debates. Actual notification logic
// never existed here at all. Both problems are fixed by this rewrite.
//
// This handler itself is intentionally small: the "user:<id>" room is
// already joined in socketManager.js on connection. Notification
// *creation* and *pushing* both happen through utils/notify.js, called
// from wherever an event actually occurs (follow, match found, debate
// result, tier change). This file just exists so future real-time,
// client-initiated notification events (e.g. "mark_seen_live") have a
// home without touching socketManager.js again.

const notificationSocket = (io, socket) => {
  // Placeholder for future client-initiated notification events.
  // Server-initiated pushes (the common case) go through utils/notify.js
  // directly via getIO().to(`user:${userId}`).emit(...) — they don't need
  // a listener here.
  socket.on("notifications_ping", () => {
    socket.emit("notifications_pong", { ok: true });
  });
};

module.exports = notificationSocket;
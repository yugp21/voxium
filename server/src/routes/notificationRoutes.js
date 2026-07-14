const express = require("express");
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require("../controllers/notificationController");
const { verifyJWT } = require("../middlewares/authMiddleware");

router.use(verifyJWT); // All notification routes require auth

router.get("/", getNotifications);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
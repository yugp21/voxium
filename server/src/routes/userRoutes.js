const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  completeOnboarding,
  uploadAvatar,
  followUser,
  unfollowUser,
  searchUsers,
} = require("../controllers/userController");
const { verifyJWT } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
 
router.get("/search", verifyJWT, searchUsers);
router.get("/:username", getProfile);                          // Public profile
router.put("/profile/update", verifyJWT, updateProfile);
router.put("/profile/onboarding", verifyJWT, completeOnboarding);
router.post("/profile/avatar", verifyJWT, upload.single("avatar"), uploadAvatar);
router.post("/:id/follow", verifyJWT, followUser);
router.delete("/:id/follow", verifyJWT, unfollowUser);
 
module.exports = router;
 
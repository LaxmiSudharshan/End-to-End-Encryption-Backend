// routes/messageRoutes.js
const express = require("express");
const router = express.Router();

const {
  sendMessage,
  receiveMessages,
  getChatHistory,
  markAsRead,
  getUnreadMessages,
} = require("../controllers/messageController");

const authMiddleware = require("../middleware/authMiddleware");


router.post("/send", authMiddleware, sendMessage);
router.get("/receive", authMiddleware, receiveMessages);
router.get("/history/:userId", authMiddleware, getChatHistory);
router.patch("/read/:messageId", authMiddleware, markAsRead);
router.get("/unread", authMiddleware, getUnreadMessages);

module.exports = router;

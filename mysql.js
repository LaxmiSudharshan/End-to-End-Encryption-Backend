// models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: { type: Number, required: true },   // MySQL user.id
  receiverId: { type: Number, required: true }, // MySQL user.id
  encryptedMessage: { type: String, required: true },
  fileUrl: { type: String }, // optional for attachments
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

module.exports = mongoose.model("Message", messageSchema);

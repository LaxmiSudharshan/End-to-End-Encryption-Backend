const crypto = require("crypto");
const db = require("../config/mysql"); // MySQL connection
const Message = require("../models/Message"); // Mongo model

// ----------------- SEND MESSAGE -----------------
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !message) {
      return res.status(400).json({ success: false, error: "receiverId and message are required" });
    }

    // ✅ Fetch receiver’s public key
    const [rows] = await db.query("SELECT publicKey FROM users WHERE id = ?", [receiverId]);
    if (!rows.length || !rows[0].publicKey) {
      return res.status(404).json({ success: false, error: "Receiver public key not found" });
    }

    const publicKey = rows[0].publicKey;

    // ✅ Encrypt message using receiver's public key
    const encryptedBuffer = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(message, "utf-8")
    );

    const encryptedMessage = encryptedBuffer.toString("base64");

    // ✅ Save encrypted message in MongoDB
    const storedMessage = await Message.create({
      senderId,
      receiverId,
      encryptedMessage,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      messageId: storedMessage._id,
    });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ success: false, error: "Message encryption failed" });
  }
};

// ----------------- RECEIVE (Decrypt Unread) -----------------
exports.receiveMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ Fetch user's private key
    const [rows] = await db.query("SELECT privateKey FROM users WHERE id = ?", [userId]);
    if (!rows.length || !rows[0].privateKey) {
      return res.status(404).json({ success: false, error: "User private key not found" });
    }

    const privateKey = rows[0].privateKey;

    // ✅ Fetch unread messages
    const unreadMessages = await Message.find({ receiverId: userId, isRead: false }).sort({ createdAt: 1 });

    // ✅ Decrypt each message
    const decryptedMessages = unreadMessages.map(msg => {
      try {
        const decryptedBuffer = crypto.privateDecrypt(
          {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
          },
          Buffer.from(msg.encryptedMessage, "base64")
        );
        return { ...msg._doc, decryptedMessage: decryptedBuffer.toString("utf-8") };
      } catch {
        return { ...msg._doc, decryptedMessage: null, error: "Decryption failed" };
      }
    });

    // ✅ Mark all as read
    await Message.updateMany({ receiverId: userId, isRead: false }, { $set: { isRead: true } });

    res.json({ success: true, messages: decryptedMessages });
  } catch (err) {
    console.error("Receive messages error:", err);
    res.status(500).json({ success: false, error: "Message decryption failed" });
  }
};

// ----------------- CHAT HISTORY -----------------
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = parseInt(req.params.userId, 10);

    // ✅ Get private key
    const [rows] = await db.query("SELECT privateKey FROM users WHERE id = ?", [userId]);
    if (!rows.length || !rows[0].privateKey) {
      return res.status(404).json({ success: false, error: "User private key not found" });
    }

    const privateKey = rows[0].privateKey;

    // ✅ Get all messages between both users
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 });

    // ✅ Decrypt only incoming messages
    const chatHistory = messages.map(msg => {
      if (msg.receiverId === userId) {
        try {
          const decryptedBuffer = crypto.privateDecrypt(
            {
              key: privateKey,
              padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
              oaepHash: "sha256",
            },
            Buffer.from(msg.encryptedMessage, "base64")
          );
          return { ...msg._doc, decryptedMessage: decryptedBuffer.toString("utf-8") };
        } catch {
          return { ...msg._doc, decryptedMessage: null, error: "Decryption failed" };
        }
      } else {
        return { ...msg._doc, decryptedMessage: "[Sent message]" };
      }
    });

    res.json({ success: true, history: chatHistory });
  } catch (err) {
    console.error("Chat history error:", err);
    res.status(500).json({ success: false, error: "Could not fetch chat history" });
  }
};

// ----------------- MARK AS READ -----------------
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ success: false, error: "Message not found" });

    if (msg.receiverId !== userId) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    msg.isRead = true;
    await msg.save();

    res.json({ success: true, updated: msg });
  } catch (err) {
    console.error("Mark as read error:", err);
    res.status(500).json({ success: false, error: "Could not mark as read" });
  }
};

// ----------------- UNREAD MESSAGES -----------------
exports.getUnreadMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query("SELECT privateKey FROM users WHERE id = ?", [userId]);
    if (!rows.length || !rows[0].privateKey) {
      return res.status(404).json({ success: false, error: "User private key not found" });
    }

    const privateKey = rows[0].privateKey;

    const unreadMessages = await Message.find({ receiverId: userId, isRead: false }).sort({ createdAt: 1 });

    const decryptedMessages = unreadMessages.map(msg => {
      try {
        const decryptedBuffer = crypto.privateDecrypt(
          {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
          },
          Buffer.from(msg.encryptedMessage, "base64")
        );
        return { ...msg._doc, decryptedMessage: decryptedBuffer.toString("utf-8") };
      } catch {
        return { ...msg._doc, decryptedMessage: null, error: "Decryption failed" };
      }
    });

    res.json({ success: true, messages: decryptedMessages });
  } catch (err) {
    console.error("Inbox error:", err);
    res.status(500).json({ success: false, error: "Could not fetch inbox" });
  }
};

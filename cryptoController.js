// controllers/cryptoController.js
const crypto = require("crypto");
const db = require("../config/mysql");
const KeyBundle = require("../models/KeyBundle");

// ----------------- GENERATE RSA KEYS -----------------
exports.generateKeys = async (req, res) => {
  try {
    // Defensive: ensure req.user exists
    if (!req.user || !req.user.id) {
      console.log("generateKeys: missing req.user:", req.user);
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const userId = Number(req.user.id);

    // create RSA pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    // Upsert into MongoDB (create or update)
    const keyBundle = await KeyBundle.findOneAndUpdate(
      { userId },
      { publicKey, privateKey, userId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Ensure MySQL users table has publicKey / privateKey columns
    await db.query(
      "UPDATE users SET publicKey = ?, privateKey = ? WHERE id = ?",
      [publicKey, privateKey, userId]
    );

    return res.status(201).json({
      success: true,
      message: keyBundle ? "Keys generated/updated successfully" : "Keys generated",
      keyBundle: { userId, publicKey } // avoid sending privateKey in response
    });
  } catch (error) {
    console.error("Key generation error:", error);
    return res.status(500).json({ success: false, error: "Key generation failed" });
  }
};

// ----------------- ENCRYPT MESSAGE -----------------
exports.encryptMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      return res
        .status(400)
        .json({ success: false, error: "receiverId and message are required" });
    }

    // Fetch receiver’s public key
    const [rows] = await db.query("SELECT publicKey FROM users WHERE id = ?", [receiverId]);
    if (!rows.length || !rows[0].publicKey) {
      return res.status(404).json({ success: false, error: "Receiver public key not found" });
    }

    const publicKey = rows[0].publicKey;

    // Encrypt using RSA-OAEP
    const encryptedBuffer = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(message, "utf-8")
    );

    const encryptedMessage = encryptedBuffer.toString("base64");

    res.json({ success: true, encryptedMessage });
  } catch (err) {
    console.error("Encryption error:", err);
    res.status(500).json({ success: false, error: "Encryption failed" });
  }
};

// ----------------- DECRYPT MESSAGE -----------------
exports.decryptMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { encryptedMessage } = req.body;

    if (!encryptedMessage) {
      return res.status(400).json({ success: false, error: "encryptedMessage is required" });
    }

    // Fetch user’s private key
    const [rows] = await db.query("SELECT privateKey FROM users WHERE id = ?", [userId]);
    if (!rows.length || !rows[0].privateKey) {
      return res.status(404).json({ success: false, error: "User private key not found" });
    }

    const privateKey = rows[0].privateKey;

    // Decrypt
    const decryptedBuffer = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(encryptedMessage, "base64")
    );

    const decryptedMessage = decryptedBuffer.toString("utf-8");

    res.json({ success: true, decryptedMessage });
  } catch (err) {
    console.error("Decryption error:", err);
    res.status(500).json({ success: false, error: "Decryption failed" });
  }
};

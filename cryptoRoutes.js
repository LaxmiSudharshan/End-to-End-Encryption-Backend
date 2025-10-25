// routes/cryptoRoutes.js
const express = require("express");
const router = express.Router();
const { generateKeys, encryptMessage, decryptMessage } = require("../controllers/cryptoController");
const authMiddleware = require("../middleware/authMiddleware");

// Routes
router.post("/generate-keys", authMiddleware, generateKeys);
router.post("/encrypt", authMiddleware, encryptMessage);
router.post("/decrypt", authMiddleware, decryptMessage);

module.exports = router;

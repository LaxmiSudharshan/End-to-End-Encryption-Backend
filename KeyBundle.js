// models/KeyBundle.js
const mongoose = require("mongoose");

const KeyBundleSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, unique: true }, // MySQL user.id
    publicKey: { type: String, required: true },
    privateKey: { type: String, required: true } // dev-only: store encrypted in prod
  },
  { timestamps: true }
);

module.exports = mongoose.model("KeyBundle", KeyBundleSchema);

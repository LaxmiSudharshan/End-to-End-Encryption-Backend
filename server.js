require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectMongoDB = require("./config/mongodb");
const db = require("./config/mysql");
const http = require("http");

const initSocket = require("./sockets/chatSocket");

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes"); 
const cryptoRoutes = require("./routes/cryptoRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Routes
app.use("/users", userRoutes);
app.use("/auth", authRoutes); 
app.use("/crypto", cryptoRoutes);
app.use("/api/messages", messageRoutes);

connectMongoDB();

// ✅ Create HTTP server **before calling initSocket**
const server = http.createServer(app);

// ✅ Initialize Socket.io
initSocket(server);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

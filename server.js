const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// ✅ SINGLE socket connection block
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Receive message
  socket.on("chat message", (msg) => {
    console.log("📩 Message:", msg);

    // Send to ALL users (including sender)
    io.emit("chat message", msg);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

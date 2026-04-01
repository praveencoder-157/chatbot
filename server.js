const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// ✅ MongoDB Connection (SAFE)
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ Mongo Error:", err));

// ✅ Schema
const messageSchema = new mongoose.Schema({
  text: String,
  time: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

// ✅ Socket
io.on("connection", async (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Load old messages safely
  let messages = [];
  try {
    messages = await Message.find().sort({ time: 1 });
  } catch (err) {
    console.log("⚠️ Load failed:", err.message);
  }

  socket.emit("load messages", messages);

  // Send & save message
  socket.on("chat message", async (msg) => {
    console.log("📩 Message:", msg);

    // Save safely (won’t crash)
    try {
      const newMsg = new Message({ text: msg });
      await newMsg.save();
    } catch (err) {
      console.log("⚠️ Save failed:", err.message);
    }

    // Always send message (even if DB fails)
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

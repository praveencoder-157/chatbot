const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());

// ✅ MongoDB Connection (SAFE)
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ Mongo Error:", err));

// ✅ Schema with sender field
const messageSchema = new mongoose.Schema({
  text: String,
  sender: String,
  time: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

// ✅ VALID USERS
const VALID_USERS = {
  "eiu2kor": "Bosch123",
  "splunk admin": "Bosch123"
};

// ✅ LOGIN ENDPOINT
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (VALID_USERS[username] && VALID_USERS[username] === password) {
    res.json({ success: true, user: username });
  } else {
    res.json({ success: false });
  }
});

// ✅ DELETE HISTORY ENDPOINT
app.post("/api/delete-history", async (req, res) => {
  try {
    await Message.deleteMany({});
    io.emit("messages cleared");
    res.json({ success: true });
  } catch (err) {
    console.log("⚠️ Delete failed:", err.message);
    res.json({ success: false });
  }
});

// ✅ Socket
io.on("connection", async (socket) => {
  const username = socket.handshake.query.username;
  console.log("🟢 User connected:", username, socket.id);

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
    console.log("📩 Message from", username, ":", msg.text);

    // Save safely (won't crash)
    try {
      const newMsg = new Message({ 
        text: msg.text, 
        sender: username 
      });
      await newMsg.save();
    } catch (err) {
      console.log("⚠️ Save failed:", err.message);
    }

    // Always send message (even if DB fails)
    io.emit("chat message", { 
      text: msg.text, 
      sender: username 
    });
  });

  // Handle history deletion
  socket.on("history deleted", () => {
    console.log("🗑️ History deleted by", username);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", username, socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

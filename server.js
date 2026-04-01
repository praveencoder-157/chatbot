const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// MongoDB Connection
//mongoose.connect(process.env.MONGO_URI)
//  .then(() => console.log("MongoDB Connected"))
//  .catch(err => console.log(err));

// Schema
const messageSchema = new mongoose.Schema({
  text: String,
  time: { type: Date, default: Date.now }
});

//const Message = mongoose.model("Message", messageSchema);

// Socket
io.on("connection", async (socket) => {
  console.log("User connected");

  //const messages = await Message.find().sort({ time: 1 });
  socket.emit("load messages", messages);

  socket.on("chat message", async (msg) => {
    const newMsg = new Message({ text: msg });
    //await newMsg.save();
    io.emit("chat message", msg);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);
});

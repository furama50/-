const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 3000;

// サーバーとSocket.IOのセットアップ
const server = http.createServer(app);
const io = new Server(server);

// 静的ファイル配信
app.use(express.static("public"));

// Socket.IOイベント
io.on("connection", (socket) => {
  console.log("👤 ユーザー接続:", socket.id);

  socket.on("sendQuestion", (data) => {
    console.log("📤 問題送信:", data);
    io.emit("newQuestion", data);
  });

  socket.on("sendAnswer", (data) => {
    console.log("📥 回答受信:", data);
    io.emit("playerAnswer", data);
  });

  socket.on("revealAnswer", (data) => {
    io.emit("showCorrectAnswer", data);
  });

  socket.on("disconnect", () => {
    console.log("👋 ユーザー切断:", socket.id);
  });
});

// ✅ ここが重要：Renderが期待するポートでlisten
server.listen(PORT, () => {
  console.log(`✅ サーバー起動 http://localhost:${PORT}`);
});

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public")); // publicディレクトリにhtmlファイルを置く

io.on("connection", (socket) => {
  console.log("👤 ユーザー接続:", socket.id);

  // ホストが問題を送信
  socket.on("sendQuestion", (data) => {
    console.log("📤 問題送信:", data);
    io.emit("newQuestion", data); // 全員に送信
  });

  // プレイヤーが回答
  socket.on("sendAnswer", (data) => {
    console.log("📥 回答受信:", data);
    io.emit("playerAnswer", data); // 全員に通知（ホスト用）
  });

  // ホストが正解を送信
  socket.on("revealAnswer", (data) => {
    io.emit("showCorrectAnswer", data);
  });

  socket.on("disconnect", () => {
    console.log("👋 ユーザー切断:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("✅ サーバー起動 http://localhost:3000");
});

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

// プレイヤー情報と回答
const players = {}; // socket.id → { name }
let currentAnswers = []; // { name, answer }

io.on("connection", (socket) => {
  console.log("👤 ユーザー接続:", socket.id);

  // プレイヤーが名前を登録
  socket.on("registerPlayer", (data) => {
    players[socket.id] = { name: data.name };
    console.log(`📝 登録: ${socket.id} → ${data.name}`);
  });

  // ホストが問題を送信
  socket.on("sendQuestion", (data) => {
    console.log("📤 問題送信:", data);
    currentAnswers = []; // 回答リセット
    io.emit("newQuestion", data);
  });

  // プレイヤーが回答
  socket.on("sendAnswer", (data) => {
    const name = data.name || players[socket.id]?.name || "名前不明";
    console.log(`📥 回答: ${name} → ${data.answer}`);

    // 最新回答を保存（同じ人が再送信したら上書き）
    const index = currentAnswers.findIndex(a => a.name === name);
    if (index !== -1) {
      currentAnswers[index].answer = data.answer;
    } else {
      currentAnswers.push({ name, answer: data.answer });
    }

    // ホストにリアルタイムで通知
    io.emit("playerAnswer", { name, answer: data.answer });
  });

  // ホストが正解を発表
  socket.on("revealAnswer", (data) => {
    const correct = data.correct;
    io.emit("showCorrectAnswer", { correct });

    // 正解したプレイヤーを抽出
      // 正解を配列に統一（互換性維持）
    const correctList = Array.isArray(correct) ? correct : [correct];

    // プレイヤーの回答を小文字比較でチェック
    const correctPlayers = currentAnswers.filter(a =>
      correctList.some(c => a.answer.trim().toLowerCase() === c.trim().toLowerCase())
    );
    
    const winner =
      correctPlayers.length > 0
        ? correctPlayers[Math.floor(Math.random() * correctPlayers.length)]
        : null;

    // ホストに正解者リストと代表を送信
    io.emit("correctPlayers", {
      correctPlayers,
      winner: winner ? winner.name : "（正解者なし）"
    });
  });

  socket.on("disconnect", () => {
    console.log("👋 ユーザー切断:", socket.id);
    delete players[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`✅ サーバー起動 http://localhost:${PORT}`);
});

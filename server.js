// ✅ server.js（変更済）
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

let hostSocketId = null;
let currentMode = "quiz"; // "quiz" or "buzzer"
let buzzerPressed = false;
let buzzerWinner = null;

const players = {}; // socket.id -> { name }
let currentAnswers = [];
let currentQuestion = null; // 👈 追加

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("👤 接続:", socket.id);

  // プレイヤー登録時
  socket.on("registerPlayer", (data) => {
    players[socket.id] = { name: data.name };
    console.log(`登録: ${data.name}`);

    // 新規プレイヤーに現在の状態を送信
    socket.emit("modeChanged", currentMode);
    if (currentQuestion) {
      socket.emit("newQuestion", currentQuestion);
    }
    if (buzzerPressed && buzzerWinner) {
      socket.emit("buzzerResult", { winner: buzzerWinner });
    }

    // ホストにプレイヤー一覧通知
    if (hostSocketId) {
      const list = Object.values(players).map(p => p.name);
      io.to(hostSocketId).emit("updatePlayerList", list);
    }
  });

  socket.on("registerHost", () => {
    hostSocketId = socket.id;
    socket.emit("updatePlayerList", Object.values(players).map(p => p.name));
    socket.emit("modeChanged", currentMode);
  });

  socket.on("changeMode", (mode) => {
    if (socket.id === hostSocketId) {
      currentMode = mode;
      buzzerPressed = false;
      buzzerWinner = null;
      io.emit("modeChanged", currentMode);
    }
  });

  socket.on("buzzPressed", () => {
    if (currentMode === "buzzer" && !buzzerPressed) {
      buzzerPressed = true;
      buzzerWinner = players[socket.id]?.name || "名前不明";
      io.emit("buzzerResult", { winner: buzzerWinner });
    }
  });

  socket.on("resetBuzzer", () => {
    if (socket.id === hostSocketId) {
      buzzerPressed = false;
      buzzerWinner = null;
      io.emit("buzzerReset");
    }
  });

  socket.on("sendQuestion", (data) => {
    currentQuestion = data;
    currentAnswers = [];
    io.emit("newQuestion", data);
  });

  socket.on("sendAnswer", (data) => {
    const name = data.name || players[socket.id]?.name || "名前不明";
    const index = currentAnswers.findIndex(a => a.name === name);
    if (index !== -1) currentAnswers[index].answer = data.answer;
    else currentAnswers.push({ name, answer: data.answer });
    io.emit("playerAnswer", { name, answer: data.answer });
  });

  socket.on("revealAnswer", (data) => {
    io.emit("showCorrectAnswer", { correct: data.correct });
    const correctList = Array.isArray(data.correct) ? data.correct : [data.correct];
    const correctPlayers = currentAnswers.filter(a =>
      correctList.some(c => a.answer.trim().toLowerCase() === c.trim().toLowerCase())
    );
    const winner = correctPlayers.length > 0
      ? correctPlayers[Math.floor(Math.random() * correctPlayers.length)]
      : null;
    io.emit("correctPlayers", {
      correctPlayers,
      winner: winner ? winner.name : "（正解者なし）"
    });
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    if (hostSocketId) {
      io.to(hostSocketId).emit("updatePlayerList", Object.values(players).map(p => p.name));
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ サーバー起動 http://localhost:${PORT}`);
});

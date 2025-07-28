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
let currentQuestion = null;
let revealedAnswer = null;
let correctPlayers = [];
let chosenWinner = null;

const players = {}; // socket.id -> { name }
let currentAnswers = []; // { name, answer }

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("👤 接続:", socket.id);

  // プレイヤー登録
  socket.on("registerPlayer", (data) => {
    players[socket.id] = { name: data.name };
    console.log(`登録: ${data.name}`);

    // ホストにプレイヤー一覧送信
    const playerList = Object.values(players).map(p => p.name);
    if (hostSocketId) io.to(hostSocketId).emit("updatePlayerList", playerList);

    // ➤ 状態同期（モード・問題・正解・抽選・早押し）
    socket.emit("modeChanged", currentMode);

    if (currentQuestion) {
      socket.emit("newQuestion", currentQuestion);
    }

    currentAnswers.forEach(a => {
      socket.emit("playerAnswer", a);
    });

    if (revealedAnswer) {
      socket.emit("showCorrectAnswer", { correct: revealedAnswer });
      socket.emit("correctPlayers", {
        correctPlayers,
        winner: chosenWinner ? chosenWinner.name : "（正解者なし）"
      });
    }

    if (currentMode === "buzzer" && buzzerPressed && buzzerWinner) {
      socket.emit("buzzerResult", { winner: buzzerWinner });
    }
  });

  // ホスト登録
  socket.on("registerHost", () => {
    hostSocketId = socket.id;
    socket.emit("updatePlayerList", Object.values(players).map(p => p.name));
    socket.emit("modeChanged", currentMode);
  });

  // モード切替
  socket.on("changeMode", (mode) => {
    if (socket.id === hostSocketId) {
      currentMode = mode;
      buzzerPressed = false;
      buzzerWinner = null;
      revealedAnswer = null;
      correctPlayers = [];
      chosenWinner = null;
      io.emit("modeChanged", currentMode);
    }
  });

  // 問題出題
  socket.on("sendQuestion", (data) => {
    currentQuestion = data;
    currentAnswers = [];
    revealedAnswer = null;
    correctPlayers = [];
    chosenWinner = null;
    io.emit("newQuestion", data);
  });

  // 回答受信
  socket.on("sendAnswer", (data) => {
    const name = data.name || players[socket.id]?.name || "名前不明";
    const index = currentAnswers.findIndex(a => a.name === name);
    if (index !== -1) {
      currentAnswers[index].answer = data.answer;
    } else {
      currentAnswers.push({ name, answer: data.answer });
    }
    io.emit("playerAnswer", { name, answer: data.answer });
  });

  // 正解を公開
  socket.on("revealAnswer", (data) => {
    revealedAnswer = data.correct;
    io.emit("showCorrectAnswer", { correct: data.correct });

    const correctList = Array.isArray(data.correct) ? data.correct : [data.correct];
    correctPlayers = currentAnswers.filter(a =>
      correctList.some(c => a.answer.trim().toLowerCase() === c.trim().toLowerCase())
    );

    chosenWinner = correctPlayers.length > 0
      ? correctPlayers[Math.floor(Math.random() * correctPlayers.length)]
      : null;

    io.emit("correctPlayers", {
      correctPlayers,
      winner: chosenWinner ? chosenWinner.name : "（正解者なし）"
    });
  });

  // 早押し処理
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

  // 切断処理
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

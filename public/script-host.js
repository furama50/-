const socket = io();
socket.emit('registerHost');

// 問題リスト（複数の正解に対応）
const questions = [
  { question: "日本の首都は？", correct: ["東京", "とうきょう"] },
  { question: "富士山の標高は？（単位：m）", correct: ["3776"] },
  { question: "英語で「りんご」は？", correct: ["apple", "Apple", "APPLE"] }
];

let currentIndex = 0;
let currentMode = "quiz"; // "quiz" or "buzzer"

// DOM
const nextBtn = document.getElementById('nextBtn');
const revealBtn = document.getElementById('revealBtn');
const resetBtn = document.getElementById('resetBtn');
const modeSelect = document.getElementById('modeSelect');
const questionDisplay = document.getElementById('questionDisplay');
const answerList = document.getElementById('answerList');
const winnerDisplay = document.getElementById('winnerDisplay');
const playerList = document.getElementById('playerList');
const playerCount = document.getElementById('playerCount');

// イベント登録
nextBtn.onclick = () => {
  if (currentIndex < questions.length) {
    const q = questions[currentIndex];
    socket.emit('sendQuestion', q);
    questionDisplay.textContent = q.question;
    answerList.innerHTML = '';
    winnerDisplay.textContent = '（まだ選ばれていません）';
    revealBtn.disabled = false;
    currentIndex++;
  } else {
    alert("すべての問題を出題しました！");
    nextBtn.disabled = true;
    revealBtn.disabled = true;
  }
};

revealBtn.onclick = () => {
  const correct = questions[currentIndex - 1]?.correct;
  if (correct) {
    socket.emit('revealAnswer', { correct });
    revealBtn.disabled = true;
  }
};

resetBtn.onclick = () => {
  socket.emit('resetBuzzer');
};

modeSelect.onchange = () => {
  currentMode = modeSelect.value;
  socket.emit('changeMode', currentMode);
};

// 回答受信
socket.on('playerAnswer', (data) => {
  let li = [...answerList.children].find(el => el.dataset.name === data.name);
  if (!li) {
    li = document.createElement('li');
    li.dataset.name = data.name;
    answerList.appendChild(li);
  }
  li.textContent = `${data.name}：${data.answer}`;
});

// 正解者と抽選
socket.on('correctPlayers', (data) => {
  const box = winnerDisplay;
  const { correctPlayers, winner } = data;

  if (correctPlayers.length === 0) {
    box.textContent = "😢 正解者がいませんでした";
    return;
  }

  // 🎰 抽選アニメーション（5秒）
  let index = 0;
  const names = correctPlayers.map(p => p.name);
  const duration = 5000;
  const interval = 100;
  const totalSteps = duration / interval;
  let step = 0;

  const intervalId = setInterval(() => {
    box.innerHTML = `🎲 抽選中... <strong>${names[index]}</strong>`;
    index = (index + 1) % names.length;
    step++;
    if (step >= totalSteps) {
      clearInterval(intervalId);
      box.innerHTML = `🎉 正解者の中から選ばれたのは：<strong>${winner}</strong> さん！`;
    }
  }, interval);
});

// プレイヤー一覧
socket.on('updatePlayerList', (names) => {
  playerList.innerHTML = '';
  names.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    playerList.appendChild(li);
  });
  playerCount.textContent = `(${names.length}人)`;
});

// モード変更時のUI反映（初期化用）
socket.on('modeChanged', (mode) => {
  currentMode = mode;
  modeSelect.value = mode;
});

// 早押し成功者をホスト画面にも表示
socket.on('buzzerResult', (data) => {
  const winnerDisplay = document.getElementById('winnerDisplay');
  if (winnerDisplay) {
    winnerDisplay.innerHTML = `🚨 回答権は <strong>${data.winner}</strong> さんです！`;
  }

// 早押しリセット時にホスト画面もクリアする
socket.on('buzzerReset', () => {
  const winnerDisplay = document.getElementById('winnerDisplay');
  if (winnerDisplay) {
    winnerDisplay.textContent = '（まだ選ばれていません）';
  }
});

});
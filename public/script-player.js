const socket = io();
let playerName = '';
let answerLocked = false;

// DOM取得
const nameArea = document.getElementById('nameArea');
const quizArea = document.getElementById('quizArea');
const buzzerArea = document.getElementById('buzzerArea');
const questionElem = document.getElementById('question');
const answerInput = document.getElementById('answerInput');
const winnerBox = document.getElementById('winnerBox');
const buzzerBtn = document.getElementById('buzzerBtn');
const buzzerResult = document.getElementById('buzzerResult');

document.getElementById('startBtn').onclick = () => {
  playerName = document.getElementById('playerName').value.trim();
  if (!playerName) return alert("名前を入力してください");
  socket.emit('registerPlayer', { name: playerName });

  nameArea.style.display = 'none';
  quizArea.style.display = 'block';
};

document.getElementById('answerBtn').onclick = () => {
  if (answerLocked) return;
  const input = answerInput.value.trim();
  if (!input) return alert("回答を入力してください");

  socket.emit('sendAnswer', { name: playerName, answer: input });
};

buzzerBtn.onclick = () => {
  socket.emit('buzzPressed');
};

// 正解の表示処理
socket.on('showCorrectAnswer', (data) => {
  answerLocked = true;
});

// 新しい問題が出たとき
socket.on('newQuestion', (data) => {
  questionElem.innerText = data.question;
  answerInput.value = '';
  winnerBox.textContent = '';
  buzzerResult.textContent = '';
  answerLocked = false;
});

// 正解者一覧・抽選結果
socket.on('correctPlayers', (data) => {
  if (data.correctPlayers.length === 0) {
    winnerBox.innerHTML = "😢 正解者がいませんでした";
  } else {
    winnerBox.innerHTML = `🎉 正解者の中から選ばれたのは：<strong>${data.winner}</strong> さん！`;
  }
});

// モード切替イベント（ホストが操作）
socket.on('modeChanged', (mode) => {
  if (mode === 'quiz') {
    quizArea.style.display = 'block';
    buzzerArea.style.display = 'none';
  } else if (mode === 'buzzer') {
    quizArea.style.display = 'none';
    buzzerArea.style.display = 'block';
    buzzerBtn.disabled = false;
    buzzerResult.textContent = '';
  }
});

// 誰が早押しに成功したか表示
socket.on('buzzerResult', ({ winner }) => {
  buzzerResult.innerHTML = `🎉 回答権は <strong>${winner}</strong> さん！`;
  buzzerBtn.disabled = true;
});

// ホストがリセットしたら再度早押し可能に
socket.on('buzzerReset', () => {
  buzzerResult.textContent = '';
  buzzerBtn.disabled = false;
});

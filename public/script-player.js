const socket = io();
let playerName = '';
let answerLocked = false;
let currentMode = 'quiz';

// DOM取得
const nameArea = document.getElementById('nameArea');
const quizArea = document.getElementById('quizArea');
const buzzerArea = document.getElementById('buzzerArea');
const questionElem = document.getElementById('question');
const answerInput = document.getElementById('answerInput');
const winnerBox = document.getElementById('winnerBox');
const buzzerBtn = document.getElementById('buzzerBtn');
const buzzerResult = document.getElementById('buzzerResult');
const buzzerQuestion = document.getElementById('buzzerQuestion');

document.getElementById('startBtn').onclick = () => {
  playerName = document.getElementById('playerName').value.trim();
  if (!playerName) return alert("名前を入力してください");
  socket.emit('registerPlayer', { name: playerName });

  nameArea.style.display = 'none';
  quizArea.style.display = 'block';
};

document.getElementById('answerBtn').onclick = () => {
  if (answerLocked) return;
  const input = document.getElementById('answerInput').value.trim();
  if (!input) return alert("回答を入力してください");

  socket.emit('sendAnswer', { name: playerName, answer: input });
  document.getElementById('selfAnswerDisplay').textContent = `あなたの回答：${input}（※あとから変更できます）`;
};

buzzerBtn.onclick = () => {
  socket.emit('buzzPressed');
  buzzerBtn.disabled = true;
};

// 新しい問題が出たとき
socket.on('newQuestion', (data) => {
  questionElem.innerText = data.question;
  buzzerQuestion.innerText = data.question;

  answerInput.value = '';
  winnerBox.textContent = '';
  buzzerResult.textContent = '';
  document.getElementById('correctDisplay').style.display = 'none';
  document.getElementById('selfAnswerDisplay').textContent = '';
  answerLocked = false;
});

// 正解の表示
socket.on('showCorrectAnswer', (data) => {
  answerLocked = true;
  const correctBox = document.getElementById('correctDisplay');
  const correct = Array.isArray(data.correct) ? data.correct.join(' / ') : data.correct;
  correctBox.textContent = `✅ 正解: ${correct}`;
  correctBox.style.display = 'block';
});

// 自分の回答受信時
socket.on('playerAnswer', (data) => {
  if (data.name === playerName) {
    answerInput.classList.add('highlight');
    setTimeout(() => answerInput.classList.remove('highlight'), 1000);
    document.getElementById('selfAnswerDisplay').textContent =
      `あなたの回答：${data.answer}（※あとから変更できます）`;
  }
});

// 正解者表示（スロット風）
socket.on('correctPlayers', (data) => {
  if (data.correctPlayers.length === 0) {
    winnerBox.innerHTML = "😢 正解者がいませんでした";
  } else {
    const names = data.correctPlayers.map(p => p.name);
    const winner = data.winner;
    let index = 0;
    const duration = 5000;
    const interval = 100;
    const totalSteps = duration / interval;
    let step = 0;

    const intervalId = setInterval(() => {
      winnerBox.innerHTML = `🎰 抽選中... <strong>${names[index]}</strong>`;
      index = (index + 1) % names.length;
      step++;
      if (step >= totalSteps) {
        clearInterval(intervalId);
        winnerBox.innerHTML = `🎉 正解者の中から選ばれたのは：<strong>${winner}</strong> さん！`;
      }
    }, interval);
  }
});

// モード切替
socket.on('modeChanged', (mode) => {
  currentMode = mode;

  if (mode === 'quiz') {
    quizArea.style.display = 'block';
    buzzerArea.style.display = 'none';
    answerInput.disabled = false;
    document.getElementById('answerBtn').disabled = false;
  } else if (mode === 'buzzer') {
    quizArea.style.display = 'none';
    buzzerArea.style.display = 'block';
    buzzerBtn.disabled = false;
    buzzerResult.textContent = '';
  }
});

// 早押し成功
socket.on('buzzerResult', ({ winner }) => {
  buzzerResult.innerHTML = `🚨 回答権は <strong>${winner}</strong> さんです！`;
  buzzerBtn.disabled = true;
});

// 早押しリセット
socket.on('buzzerReset', () => {
  buzzerResult.textContent = '';
  buzzerBtn.disabled = false;
});

const socket = io();
let playerName = '';
let answerLocked = false;
let currentMode = 'quiz';

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

  // 表示はモード切り替えイベントで制御
};

document.getElementById('answerBtn').onclick = () => {
  if (answerLocked) return;
  const input = answerInput.value.trim();
  if (!input) return alert("回答を入力してください");

  socket.emit('sendAnswer', { name: playerName, answer: input });
};

buzzerBtn.onclick = () => {
  socket.emit('buzzPressed');
  buzzerBtn.disabled = true;
};

socket.on('newQuestion', (data) => {
  questionElem.innerText = data.question;
  answerInput.value = '';
  winnerBox.textContent = '';
  buzzerResult.textContent = '';
  document.getElementById('correctDisplay').style.display = 'none';
  answerLocked = false;

  document.getElementById('selfAnswerDisplay').textContent = '';

  if (currentMode === 'quiz') {
    quizArea.style.display = 'block';
    buzzerArea.style.display = 'none';
  } else {
    quizArea.style.display = 'none';
    buzzerArea.style.display = 'block';
    buzzerBtn.disabled = false;
  }
});

socket.on('showCorrectAnswer', (data) => {
  answerLocked = true;
  const correctBox = document.getElementById('correctDisplay');
  const correct = Array.isArray(data.correct) ? data.correct.join(' / ') : data.correct;
  correctBox.textContent = `✅ 正解: ${correct}`;
  correctBox.style.display = 'block';
});

socket.on('playerAnswer', (data) => {
  if (data.name === playerName) {
    answerInput.classList.add('highlight');
    setTimeout(() => {
      answerInput.classList.remove('highlight');
    }, 1000);

    document.getElementById('selfAnswerDisplay').textContent =
      `あなたの回答：${data.answer}（※あとから変更できます）`;
  }
});

socket.on('correctPlayers', (data) => {
  const { correctPlayers, winner } = data;

  if (correctPlayers.length === 0) {
    winnerBox.textContent = "😢 正解者がいませんでした";
    return;
  }

  // スロット風アニメーション
  let index = 0;
  const names = correctPlayers.map(p => p.name);
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
});

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

socket.on('buzzerResult', ({ winner }) => {
  buzzerResult.innerHTML = `🚨 回答権は <strong>${winner}</strong> さんです！`;
  buzzerBtn.disabled = true;
});

socket.on('buzzerReset', () => {
  buzzerResult.textContent = '';
  buzzerBtn.disabled = false;
});

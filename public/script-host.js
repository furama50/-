const socket = io();

socket.emit('registerHost');

// あらかじめ用意した問題と正解
const questions = [
  { question: "日本の首都は？", correct: ["東京", "とうきょう"] },
  { question: "富士山の標高は？（単位：m）", correct: ["3776"] },
  { question: "英語で「りんご」は？", correct: ["apple", "Apple", "APPLE"] }
];

let currentIndex = 0;

const nextBtn = document.getElementById('nextBtn');
const revealBtn = document.getElementById('revealBtn');
const questionDisplay = document.getElementById('questionDisplay');
const answerList = document.getElementById('answerList');
const winnerDisplay = document.getElementById('winnerDisplay');

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

// 回答の受信
socket.on('playerAnswer', (data) => {
  let li = [...answerList.children].find(el => el.dataset.name === data.name);
  if (!li) {
    li = document.createElement('li');
    li.dataset.name = data.name;
    answerList.appendChild(li);
  }
  li.textContent = `${data.name}：${data.answer}`;
});

// 抽選結果の表示
socket.on('correctPlayers', (data) => {
 const box = document.getElementById('winnerDisplay');

  const { correctPlayers, winner } = data;

  if (correctPlayers.length === 0) {
    box.textContent = "😢 正解者がいませんでした";
    return;
  }

  // 🎰 アニメーション開始
  let index = 0;
  const names = correctPlayers.map(p => p.name);
  const duration = 5000; // 5秒
  const interval = 100;  // 切り替え間隔
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

// 参加者一覧の受信と表示
socket.on('updatePlayerList', (names) => {
  const playerList = document.getElementById('playerList');
  const playerCount = document.getElementById('playerCount');

  playerList.innerHTML = '';
  names.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    playerList.appendChild(li);
  });

  playerCount.textContent = `(${names.length}人)`;
});

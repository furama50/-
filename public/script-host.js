const socket = io();

// あらかじめ用意した問題と正解
const questions = [
  { question: "日本の首都は？", correct: "東京" },
  { question: "富士山の標高は？（単位：m）", correct: "3776" },
  { question: "英語で「りんご」は？", correct: "apple" }
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
  winnerDisplay.textContent = data.correctPlayers.length > 0
    ? `🎯 正解者の中から選ばれたのは：${data.winner} さん！`
    : "😢 正解者がいませんでした";
});


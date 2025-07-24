const socket = io();

const questions = [
  {
    question: "日本の首都はどこ？",
    options: ["大阪", "名古屋", "東京", "福岡"],
    correct: "東京"
  },
  {
    question: "富士山の高さは？",
    options: ["2776m", "3776m", "4776m", "5776m"],
    correct: "3776m"
  },
  {
    question: "りんごは英語で？",
    options: ["Banana", "Grape", "Apple", "Orange"],
    correct: "Apple"
  }
];

let currentIndex = 0;

const nextBtn = document.getElementById('nextBtn');
const revealBtn = document.getElementById('revealBtn');
const questionDisplay = document.getElementById('questionDisplay');
const optionDisplay = document.getElementById('optionDisplay');

function showCurrentQuestion(q) {
  questionDisplay.textContent = q.question;
  optionDisplay.innerHTML = '';
  q.options.forEach((opt) => {
    const li = document.createElement('li');
    li.textContent = opt;
    optionDisplay.appendChild(li);
  });
}

nextBtn.addEventListener('click', () => {
  if (currentIndex < questions.length) {
    const q = questions[currentIndex];
    socket.emit('sendQuestion', q);
    showCurrentQuestion(q);
    revealBtn.disabled = false;
    currentIndex++;
  } else {
    alert("すべての問題を出題しました！");
    nextBtn.disabled = true;
    revealBtn.disabled = true;
  }
});

revealBtn.addEventListener('click', () => {
  const correct = questions[currentIndex - 1]?.correct;
  if (correct) {
    socket.emit('revealAnswer', { correct });
    revealBtn.disabled = true; // 二重送信防止
  }
});

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

document.getElementById('nextBtn').addEventListener('click', () => {
  if (currentIndex < questions.length) {
    socket.emit('sendQuestion', questions[currentIndex]);
    currentIndex++;
  } else {
    alert("すべての問題を出題しました！");
  }
});

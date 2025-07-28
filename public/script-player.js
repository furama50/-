const socket = io();
let playerName = '';
let answerLocked = false;

document.getElementById('startBtn').onclick = () => {
  playerName = document.getElementById('playerName').value.trim();
  if (!playerName) return alert("名前を入力してください");

  socket.emit('registerPlayer', { name: playerName });

  document.getElementById('nameArea').style.display = 'none';
  document.getElementById('quizArea').style.display = 'block';
};

// ⚠️ 名前重複エラーを受け取った場合の処理
socket.on('nameRejected', (data) => {
  alert(data.reason || "名前が使用できません");
});

socket.on('newQuestion', (data) => {
  document.getElementById('question').innerText = data.question;
  document.getElementById('answerInput').value = '';
  answerLocked = false;
  document.getElementById('winnerBox').textContent = '';
  document.getElementById('submittedAnswer').textContent = ''; // 👈 追加
});

document.getElementById('answerBtn').onclick = () => {
  if (answerLocked) return;
  const input = document.getElementById('answerInput').value.trim();
  if (!input) return alert("回答を入力してください");

  socket.emit('sendAnswer', { name: playerName, answer: input });

  // 👇 ここで自分の送信した回答を表示
  const submitted = document.getElementById('submittedAnswer');
  submitted.innerHTML = `✅ あなたの回答：<strong>${input}</strong>`;
};

socket.on('showCorrectAnswer', (data) => {
  answerLocked = true;
});

socket.on('correctPlayers', (data) => {
  const box = document.getElementById('winnerBox');
  if (data.correctPlayers.length === 0) {
    box.innerHTML = "😢 正解者がいませんでした";
  } else {
    box.innerHTML = `🎉 正解者の中から選ばれたのは：<strong>${data.winner}</strong> さん！`;
  }
});


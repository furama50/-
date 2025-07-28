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

  const correctList = Array.isArray(data.correct) ? data.correct : [data.correct];
  const playerAnswer = document.getElementById('answerInput').value.trim().toLowerCase();
  const isCorrect = correctList.some(c => c.trim().toLowerCase() === playerAnswer);

  const box = document.getElementById('winnerBox');
  const correctText = correctList.join(" / ");

  if (isCorrect) {
    box.innerHTML = `✅ <strong>正解！</strong> お見事！<br>正解は：<strong>${correctText}</strong>`;
    box.style.color = "#2e7d32"; // 緑
  } else {
    box.innerHTML = `❌ <strong>残念！</strong><br>正解は：<strong>${correctText}</strong>`;
    box.style.color = "#c62828"; // 赤
  }
});

socket.on('correctPlayers', (data) => {
  const box = document.getElementById('winnerBox' || 'winnerDisplay'); // ← プレイヤー用とホスト用を共通化したい場合は切り替えてください
  const { correctPlayers, winner } = data;

  if (correctPlayers.length === 0) {
    box.innerHTML = "😢 正解者がいませんでした";
    return;
  }

  const names = correctPlayers.map(p => p.name);
  let index = 0;
  let delay = 50;      // 初期スピード（ms）
  const maxDelay = 500; // 最終的な遅さ
  const totalDuration = 5000; // 合計時間（ms）
  let elapsed = 0;

  function spin() {
    box.innerHTML = `🎰 抽選中... <strong>${names[index]}</strong>`;
    index = (index + 1) % names.length;

    // 加速から減速へ：delayをだんだん増やしていく
    delay = Math.min(maxDelay, delay * 1.15);
    elapsed += delay;

    if (elapsed < totalDuration) {
      setTimeout(spin, delay);
    } else {
      box.innerHTML = `🎉 正解者の中から選ばれたのは：<strong>${winner}</strong> さん！`;
    }
  }

  spin(); // 開始
});


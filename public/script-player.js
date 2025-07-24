const socket = io();
let playerName = '';
let answerLocked = false;
let selectedButton = null;

document.getElementById('startBtn').onclick = () => {
  playerName = document.getElementById('playerName').value.trim();
  if (!playerName) return alert("名前を入力してください");

  socket.emit('registerPlayer', { name: playerName });

  document.getElementById('nameArea').style.display = 'none';
  document.getElementById('quizArea').style.display = 'block';
};

socket.on('newQuestion', (data) => {
  const optionsDiv = document.getElementById('options');
  document.getElementById('question').innerText = data.question;
  optionsDiv.innerHTML = '';
  answerLocked = false;
  selectedButton = null;

  data.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.onclick = () => {
      if (answerLocked) return;
      if (selectedButton) selectedButton.style.backgroundColor = '';
      btn.style.backgroundColor = '#87CEFA';
      selectedButton = btn;

      socket.emit('sendAnswer', { answer: opt, name: playerName });
    };
    optionsDiv.appendChild(btn);
  });
});

socket.on('showCorrectAnswer', (data) => {
  answerLocked = true;
  const allButtons = document.querySelectorAll('#options button');
  allButtons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === data.correct) {
      btn.style.border = '3px solid green';
    }
  });
});

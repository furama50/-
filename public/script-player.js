const socket = io();

socket.on('newQuestion', (data) => {
  document.getElementById('question').innerText = data.question;

  const optionsDiv = document.getElementById('options');
  optionsDiv.innerHTML = '';
  data.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.onclick = () => {
      socket.emit('sendAnswer', { answer: opt });
    };
    optionsDiv.appendChild(btn);
  });
});

socket.on('showCorrectAnswer', (data) => {
  const allButtons = document.querySelectorAll('#options button');
  allButtons.forEach((btn) => {
    if (btn.textContent === data.correct) {
      btn.style.backgroundColor = 'lightgreen';  // 正解の色
    } else {
      btn.style.backgroundColor = 'lightcoral';  // 不正解の色
    }
    btn.disabled = true;  // すべてのボタンを無効に
  });
});

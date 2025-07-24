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

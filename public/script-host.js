const socket = io();

document.getElementById('sendBtn').addEventListener('click', () => {
  const question = document.getElementById('question').value;
  const options = [
    document.getElementById('opt1').value,
    document.getElementById('opt2').value,
    document.getElementById('opt3').value,
    document.getElementById('opt4').value
  ];
  const correct = document.getElementById('correct').value;

  socket.emit('sendQuestion', { question, options, correct });
});

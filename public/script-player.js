const socket = io();

let answerLocked = false; // 正解発表後はロック
let selectedButton = null;

socket.on('newQuestion', (data) => {
  document.getElementById('question').innerText = data.question;

  const optionsDiv = document.getElementById('options');
  optionsDiv.innerHTML = '';

  answerLocked = false; // 問題が新しくなったらロック解除
  selectedButton = null;

  data.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.style.margin = '4px';

    btn.onclick = () => {
      if (answerLocked) return;

      // 前の選択ボタンの色を戻す
      if (selectedButton) {
        selectedButton.style.backgroundColor = '';
      }

      // 現在のボタンに選択色
      btn.style.backgroundColor = '#87CEFA';
      selectedButton = btn;

      // 回答送信（何度でも送れる）
      socket.emit('sendAnswer', { answer: opt });
    };

    optionsDiv.appendChild(btn);
  });
});

// ホストが正解を発表したらロック＆正解表示
socket.on('showCorrectAnswer', (data) => {
  answerLocked = true;

  const allButtons = document.querySelectorAll('#options button');
  allButtons.forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === data.correct) {
      btn.style.border = '3px solid green';
    }
  });
});

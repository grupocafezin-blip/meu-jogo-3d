// --- Certifique-se que body e head já foram criados aqui ---
body.material.color.set(0x0000ff); // cor padrão temporária
head.material.color.set(0xff00ff); // cor padrão temporária

// Conectar socket
const socket = io();

// Função para pegar nome, cor e sala
function getPlayerInfo(){
    let name = null;
    while(!name){
        name = prompt("Digite seu nome:");
        if(!name) alert("Você precisa digitar um nome!");
    }

    let color = null;
    while(!color){
        color = prompt("Digite a cor do seu personagem (red, blue, #ff00ff):");
        if(!color) alert("Você precisa digitar uma cor!");
    }

    let room = null;
    while(!room){
        room = prompt("Digite o nome da sala:");
        if(!room) alert("Você precisa digitar o nome da sala!");
    }

    return {name, color, room};
}

// Chama função depois que body/head estão prontos
const playerInfo = getPlayerInfo();
const playerName = playerInfo.name;
const playerColor = playerInfo.color;
const room = playerInfo.room;

// Aplica cor escolhida
try {
    body.material.color.set(playerColor);
    head.material.color.set(playerColor);
} catch(e){
    console.warn("Cor inválida, usando padrão.");
}

// Entra na sala
socket.emit('joinRoom', room);

// --- Botão para mostrar/esconder chat ---
const toggleChatBtn = document.createElement('button');
toggleChatBtn.id = 'toggleChatBtn';
toggleChatBtn.textContent = 'Chat';
document.body.appendChild(toggleChatBtn);

toggleChatBtn.addEventListener('click', () => {
  const chat = document.getElementById('chat');
  if(chat.style.display === 'none' || !chat.style.display){
    chat.style.display = 'block';
  } else {
    chat.style.display = 'none';
  }
});

// --- Chat ---
const messagesDiv = document.getElementById('messages');
const msgForm = document.getElementById('msgForm');
const msgInput = document.getElementById('msgInput');
const bagBtn = document.getElementById('bagBtn');

msgForm.addEventListener('submit', e => {
  e.preventDefault(); // impede de recarregar a página
  if (msgInput.value) {
    socket.emit('chatMessage', msgInput.value);
    msgInput.value = '';
  }
});

bagBtn.addEventListener('click', () => {
  socket.emit('giveBag');
});

socket.on('message', msg => {
  const div = document.createElement('div');
  div.classList.add('msg');
  div.textContent = `${msg.sender}: ${msg.text}`;
  messagesDiv.appendChild(div);
});

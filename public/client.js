const socket = io();
// Função para pedir nome, cor e sala
function getPlayerInfo(){
    let name = null;
    while(!name){
        name = prompt("Digite seu nome:");
    }

    let color = null;
    while(!color){
        color = prompt("Digite a cor do seu personagem (red, blue, #ff00ff):");
    }

    let room = null;
    while(!room){
        room = prompt("Digite o nome da sala:");
    }

    return {name, color, room};
}

// Chama função
const playerInfo = getPlayerInfo();
const playerName = playerInfo.name;
const playerColor = playerInfo.color;
const room = playerInfo.room;

// Aplica cor
body.material.color.set(playerColor);
head.material.color.set(playerColor);

// Entra na sala
socket.emit('joinRoom', room);
// Botão para mostrar/esconder chat
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
// Chat
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

// Mundo 3D
const scene = new THREE.Scene();
scene.background = new THREE.Color('skyblue');
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Chão
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 'green' });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Personagem
const bodyGeometry = new THREE.BoxGeometry(1, 3, 1);
const headGeometry = new THREE.BoxGeometry(1, 1, 1);
const bodyMaterial = new THREE.MeshBasicMaterial({ color: 'blue' });
const headMaterial = new THREE.MeshBasicMaterial({ color: 'pink' });

const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
const head = new THREE.Mesh(headGeometry, headMaterial);
head.position.y = 2;
body.add(head);
scene.add(body);

// Câmera segue o jogador
camera.position.set(0, 5, 10); // altura atrás do jogador

let pointerDown = false;
let prevX, prevY;

document.addEventListener('pointerdown', e => {
  pointerDown = true;
  prevX = e.clientX;
  prevY = e.clientY;
});

document.addEventListener('pointermove', e => {
  if(!pointerDown) return;
  const dx = e.clientX - prevX;
  const dy = e.clientY - prevY;
  body.rotation.y -= dx * 0.005; // rotaciona personagem horizontal
  camera.rotation.x -= dy * 0.005; // rotaciona câmera vertical
  prevX = e.clientX;
  prevY = e.clientY;
});

document.addEventListener('pointerup', e => {
  pointerDown = false;
});

function animate() {
  requestAnimationFrame(animate);
  // Movimento do jogador
  body.position.x += velocity.x;
  body.position.z += velocity.z;

  // Câmera segue de trás
  const relativeCameraOffset = new THREE.Vector3(0, 5, 10);
  const cameraOffset = relativeCameraOffset.applyMatrix4(body.matrixWorld);
  camera.position.lerp(cameraOffset, 0.1);
  camera.lookAt(body.position);

  renderer.render(scene, camera);
}
animate();
bagBtn.addEventListener('click', () => {
  socket.emit('giveBag'); // avisa outros jogadores
  // efeito local
  body.position.y -= 0.2;
  setTimeout(() => body.position.y += 0.2, 200);
});

socket.on('playerHit', id => {
  if(socket.id === id){
    // jogador foi atingido
    body.position.y = 0; // cai no chão
    setTimeout(() => body.position.y = 0, 3000); // 3s
  }
});

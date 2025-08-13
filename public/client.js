// Mostrar erros na tela (útil no celular)
(function setupErrorOverlay(){
  const el = document.getElementById('errLog');
  function show(msg){
    el.style.display = 'block';
    el.textContent += msg + "\n";
  }
  window.addEventListener('error', (e) => show(String(e.error || e.message)));
  window.addEventListener('unhandledrejection', (e) => show(String(e.reason)));
})();

// ====== THREE.js - Cena ======
const scene = new THREE.Scene();
scene.background = new THREE.Color('skyblue');

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Chão
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshBasicMaterial({ color: 'green' })
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// Personagem
const body = new THREE.Mesh(new THREE.BoxGeometry(1,3,1), new THREE.MeshBasicMaterial({ color: 'blue' }));
const head = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({ color: 'pink' }));
head.position.y = 2;
body.add(head);
scene.add(body);

// ====== Socket.IO ======
const socket = io();

// Pede nome/cor/sala APÓS criar o personagem (evita crash)
function getPlayerInfo() {
  let name = null;
  while(!name){
    name = prompt("Digite seu nome:");
    if (!name) alert("Você precisa digitar um nome!");
  }
  let color = null;
  while(!color){
    color = prompt("Digite a cor do seu personagem (ex: red, blue, #ff00ff):");
    if (!color) alert("Você precisa digitar uma cor!");
  }
  let room = null;
  while(!room){
    room = prompt("Digite o nome da sala:");
    if (!room) alert("Você precisa digitar o nome da sala!");
  }
  return { name, color, room };
}

const { name: playerName, color: playerColor, room } = getPlayerInfo();
try {
  body.material.color.set(playerColor);
  head.material.color.set(playerColor);
} catch(e) {
  console.warn("Cor inválida, usando padrão.");
}
socket.emit('joinRoom', room);

// ====== Chat e UI ======
const chat = document.getElementById('chat');
const toggleChatBtn = document.getElementById('toggleChatBtn');
const closeChat = document.getElementById('closeChat');
const messagesDiv = document.getElementById('messages');
const msgForm = document.getElementById('msgForm');
const msgInput = document.getElementById('msgInput');
const bagBtn = document.getElementById('bagBtn');

toggleChatBtn.addEventListener('click', () => chat.style.display = 'block');
closeChat.addEventListener('click', () => chat.style.display = 'none');

msgForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (msgInput.value.trim().length) {
    socket.emit('chatMessage', msgInput.value.trim());
    msgInput.value = '';
  }
});

bagBtn.addEventListener('click', () => {
  socket.emit('giveBag');
  // Efeito local leve
  body.position.y -= 0.25;
  setTimeout(() => body.position.y += 0.25, 160);
});

socket.on('message', (msg) => {
  const div = document.createElement('div');
  div.className = 'msg';
  div.textContent = `${msg.sender}: ${msg.text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('playerHit', (id) => {
  // Cai no chão (simples)
  if (socket.id === id) {
    body.rotation.z = 1.2;
    setTimeout(() => { body.rotation.z = 0; }, 3000);
  }
});

// ====== Controles (giro com dedo + andar simples com setas) ======
let velocity = { x: 0, z: 0 };
let pointerDown = false, prevX = 0, prevY = 0;

document.addEventListener('pointerdown', (e) => {
  pointerDown = true; prevX = e.clientX; prevY = e.clientY;
});
document.addEventListener('pointermove', (e) => {
  if (!pointerDown) return;
  const dx = e.clientX - prevX;
  const dy = e.clientY - prevY;
  body.rotation.y -= dx * 0.005; // gira personagem
  camera.rotation.x -= dy * 0.005; // gira câmera vertical
  prevX = e.clientX; prevY = e.clientY;
});
document.addEventListener('pointerup', () => { pointerDown = false; });

// Setas para andar (só pra testar sem analógico)
const keys = {};
document.addEventListener('keydown', (e)=> { keys[e.key] = true; });
document.addEventListener('keyup', (e)=> { keys[e.key] = false; });

function updateMovement(){
  const speed = 0.08;
  velocity.x = 0; velocity.z = 0;
  if (keys['ArrowUp'] || keys['w'])  velocity.z = -speed;
  if (keys['ArrowDown'] || keys['s']) velocity.z =  speed;
  if (keys['ArrowLeft'] || keys['a']) velocity.x = -speed;
  if (keys['ArrowRight'] || keys['d']) velocity.x =  speed;
}

// ====== Câmera seguindo ======
camera.position.set(0, 5, 10);

function animate(){
  requestAnimationFrame(animate);

  updateMovement();
  body.position.x += velocity.x;
  body.position.z += velocity.z;

  // câmera atrás do jogador
  const offset = new THREE.Vector3(0, 5, 10);
  const worldOffset = offset.applyMatrix4(body.matrixWorld);
  camera.position.lerp(worldOffset, 0.12);
  camera.lookAt(body.position);

  renderer.render(scene, camera);
}
animate();

// Responsivo
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
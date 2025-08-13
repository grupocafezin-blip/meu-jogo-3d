const socket = io();

// Entrada na sala
let room = prompt("Digite o nome da sala:");
socket.emit('joinRoom', room);

// Chat
const messagesDiv = document.getElementById('messages');
const msgForm = document.getElementById('msgForm');
const msgInput = document.getElementById('msgInput');
const bagBtn = document.getElementById('bagBtn');

msgForm.addEventListener('submit', e => {
  e.preventDefault();
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

camera.position.z = 5;

// Joystick
const joystick = nipplejs.create({
  zone: document.body,
  mode: 'static',
  position: { left: '50px', bottom: '50px' }
});

let velocity = { x: 0, z: 0 };
joystick.on('move', (evt, data) => {
  const rad = data.angle.radian;
  velocity.x = Math.cos(rad) * 0.1;
  velocity.z = Math.sin(rad) * 0.1;
});
joystick.on('end', () => { velocity.x = 0; velocity.z = 0; });

function animate() {
  requestAnimationFrame(animate);
  body.position.x += velocity.x;
  body.position.z += velocity.z;
  renderer.render(scene, camera);
}
animate();

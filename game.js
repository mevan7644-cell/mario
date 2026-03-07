const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const WORLD_WIDTH = 3200;
const GROUND_Y = 460;
const GRAVITY = 0.95;

const keys = new Set();
const controls = {
  left: ['ArrowLeft', 'a', 'A'],
  right: ['ArrowRight', 'd', 'D'],
  jump: [' ', 'ArrowUp', 'w', 'W']
};

const player = {
  x: 80,
  y: GROUND_Y - 62,
  w: 44,
  h: 62,
  vx: 0,
  vy: 0,
  speed: 5,
  jumpPower: -17,
  onGround: false,
  facing: 1
};

const platforms = [
  { x: 330, y: 380, w: 140, h: 18 },
  { x: 560, y: 330, w: 170, h: 18 },
  { x: 900, y: 360, w: 120, h: 18 },
  { x: 1200, y: 300, w: 200, h: 18 },
  { x: 1600, y: 370, w: 120, h: 18 },
  { x: 1850, y: 320, w: 170, h: 18 },
  { x: 2160, y: 270, w: 170, h: 18 },
  { x: 2540, y: 340, w: 190, h: 18 }
];

const goombas = [
  { x: 650, y: GROUND_Y - 28, w: 32, h: 28, dir: -1, left: 610, right: 760, dead: false },
  { x: 1460, y: GROUND_Y - 28, w: 32, h: 28, dir: 1, left: 1410, right: 1530, dead: false },
  { x: 2260, y: GROUND_Y - 28, w: 32, h: 28, dir: -1, left: 2210, right: 2360, dead: false }
];

const coins = Array.from({ length: 18 }, (_, i) => ({
  x: 180 + i * 160,
  y: 190 + (i % 3) * 35,
  r: 11,
  taken: false
}));

const flag = { x: WORLD_WIDTH - 170, y: 130, w: 16, h: 330 };

let cameraX = 0;
let score = 0;
let state = 'playing';

function intersects(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function resetGame() {
  player.x = 80;
  player.y = GROUND_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  score = 0;
  state = 'playing';
  coins.forEach((coin) => {
    coin.taken = false;
  });
  goombas.forEach((goomba) => {
    goomba.dead = false;
  });
}

function update() {
  if (state !== 'playing') {
    if (keys.has('r') || keys.has('R') || keys.has('Enter')) {
      resetGame();
    }
    return;
  }

  const moveLeft = controls.left.some((key) => keys.has(key));
  const moveRight = controls.right.some((key) => keys.has(key));
  const jump = controls.jump.some((key) => keys.has(key));

  player.vx = 0;
  if (moveLeft) {
    player.vx = -player.speed;
    player.facing = -1;
  }
  if (moveRight) {
    player.vx = player.speed;
    player.facing = 1;
  }

  if (jump && player.onGround) {
    player.vy = player.jumpPower;
    player.onGround = false;
  }

  player.vy += GRAVITY;
  player.x += player.vx;

  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));

  player.y += player.vy;
  player.onGround = false;

  if (player.y + player.h >= GROUND_Y) {
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  for (const platform of platforms) {
    if (intersects(player, platform)) {
      const playerBottom = player.y + player.h;
      const prevBottom = playerBottom - player.vy;
      if (prevBottom <= platform.y + 2 && player.vy >= 0) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vx > 0) {
        player.x = platform.x - player.w;
      } else if (player.vx < 0) {
        player.x = platform.x + platform.w;
      }
    }
  }

  for (const coin of coins) {
    if (!coin.taken) {
      const dx = (player.x + player.w / 2) - coin.x;
      const dy = (player.y + player.h / 2) - coin.y;
      if (Math.hypot(dx, dy) < coin.r + 16) {
        coin.taken = true;
        score += 10;
      }
    }
  }

  for (const goomba of goombas) {
    if (goomba.dead) continue;

    goomba.x += goomba.dir * 1.3;
    if (goomba.x < goomba.left || goomba.x > goomba.right) {
      goomba.dir *= -1;
    }

    if (intersects(player, goomba)) {
      const stomp = player.vy > 1 && player.y + player.h - goomba.y < 24;
      if (stomp) {
        goomba.dead = true;
        player.vy = -10;
        score += 50;
      } else {
        state = 'lost';
      }
    }
  }

  if (player.x + player.w >= flag.x + flag.w) {
    state = 'won';
  }

  cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, player.x - canvas.width * 0.35));
}

function drawCloud(x, y, scale = 1) {
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(x, y, 24 * scale, 0, Math.PI * 2);
  ctx.arc(x + 24 * scale, y - 14 * scale, 19 * scale, 0, Math.PI * 2);
  ctx.arc(x + 48 * scale, y, 24 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#80d7ff');
  sky.addColorStop(1, '#c9f2ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawCloud(120 - cameraX * 0.15, 90, 1.2);
  drawCloud(480 - cameraX * 0.2, 120, 1);
  drawCloud(830 - cameraX * 0.25, 95, 0.9);
  drawCloud(1300 - cameraX * 0.3, 115, 1.1);

  ctx.fillStyle = '#5bbb4f';
  ctx.fillRect(-cameraX, GROUND_Y, WORLD_WIDTH, canvas.height - GROUND_Y);

  ctx.fillStyle = '#a86a3c';
  for (let i = 0; i < WORLD_WIDTH; i += 56) {
    ctx.fillRect(i - cameraX, GROUND_Y + 24, 40, 20);
  }

  ctx.fillStyle = '#915026';
  for (const platform of platforms) {
    ctx.fillRect(platform.x - cameraX, platform.y, platform.w, platform.h);
  }

  for (const coin of coins) {
    if (coin.taken) continue;
    ctx.fillStyle = '#ffd73f';
    ctx.beginPath();
    ctx.arc(coin.x - cameraX, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f6b400';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(coin.x - cameraX, coin.y - 7);
    ctx.lineTo(coin.x - cameraX, coin.y + 7);
    ctx.stroke();
  }

  for (const goomba of goombas) {
    if (goomba.dead) continue;
    const gx = goomba.x - cameraX;
    ctx.fillStyle = '#8c4f28';
    ctx.fillRect(gx, goomba.y, goomba.w, goomba.h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(gx + 7, goomba.y + 8, 6, 6);
    ctx.fillRect(gx + 19, goomba.y + 8, 6, 6);
  }

  ctx.fillStyle = '#b5b5b5';
  ctx.fillRect(flag.x - cameraX, flag.y, flag.w, flag.h);
  ctx.fillStyle = '#ff3b3b';
  ctx.beginPath();
  ctx.moveTo(flag.x + flag.w - cameraX, flag.y + 22);
  ctx.lineTo(flag.x + flag.w + 70 - cameraX, flag.y + 45);
  ctx.lineTo(flag.x + flag.w - cameraX, flag.y + 70);
  ctx.closePath();
  ctx.fill();

  const px = player.x - cameraX;

  ctx.fillStyle = '#e63d2f';
  ctx.fillRect(px + 5, player.y + 10, player.w - 10, 17);

  ctx.fillStyle = '#286ad1';
  ctx.fillRect(px + 7, player.y + 27, player.w - 14, player.h - 27);

  ctx.fillStyle = '#f6c394';
  ctx.fillRect(px + 8, player.y + 3, player.w - 16, 14);

  ctx.fillStyle = '#c9251a';
  ctx.fillRect(px + 3, player.y, player.w - 6, 8);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px system-ui';
  ctx.fillText(`Score: ${score}`, 22, 36);

  if (state !== 'playing') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px system-ui';
    ctx.fillText(state === 'won' ? 'You Win!' : 'Game Over', canvas.width / 2, canvas.height / 2 - 18);
    ctx.font = '24px system-ui';
    ctx.fillText('Press R or Enter to restart', canvas.width / 2, canvas.height / 2 + 24);
    ctx.textAlign = 'start';
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  keys.add(event.key);
  if (controls.jump.includes(event.key)) {
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key);
});

loop();

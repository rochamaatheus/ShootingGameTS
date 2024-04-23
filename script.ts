// Setting Canvas
const canvas = document.querySelector('canvas');
if (!canvas) throw new Error('Erro: Canvas não definido');
const context = canvas.getContext('2d')!;

canvas.width = innerWidth - 5;
canvas.height = innerHeight - 5;

// Canvas Size
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// Center
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

// Score
const scoreEl = document.getElementById('scoreEl');

// ScoreBoard
const scoreBoard = document.getElementById('scoreBoard');

// Start Game
const startGameButton = document.getElementById('startGameButton');

// Setting Classes
class Player {
  constructor(
    public x: number,
    public y: number,
    public radius: number,
    public color: string,
  ) {}

  draw() {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
  }
}

class Projectile extends Player {
  constructor(
    x: number,
    y: number,
    radius: number,
    color: string,
    public velocity: { x: number; y: number },
  ) {
    super(x, y, radius, color);
  }
  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Enemy extends Projectile {
  constructor(
    x: number,
    y: number,
    radius: number,
    color: string,
    velocity: { x: number; y: number },
  ) {
    super(x, y, radius, color, velocity);
  }
}

const friction = 0.99;
class Particle extends Enemy {
  public alpha: number;
  constructor(
    x: number,
    y: number,
    radius: number,
    color: string,
    velocity: { x: number; y: number },
  ) {
    super(x, y, radius, color, velocity);
    this.alpha = 1;
  }
  draw() {
    context.save();
    context.globalAlpha = this.alpha;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
    context.restore();
  }
  update() {
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01;
  }
}

// Creating
let player = new Player(centerX, centerY, 15, 'white');
let projectiles: Projectile[] = [];
let enemies: Enemy[] = [];
let particles: Particle[] = [];

function init() {
  player = new Player(centerX, centerY, 15, 'white');
  projectiles = [];
  enemies = [];
  particles = [];
  score = 0;
  enemyEachTime = 1000;
  clearInterval(intervalId);
  if (scoreEl) scoreEl.innerText = '0';
}

// Looping

let score = 0;
let enemyEachTime = 1000;
let intervalId: number;

function spawnEnemies() {
  intervalId = setInterval(() => {
    const radius = Math.random() * (30 - 4) + 4;

    let x;
    let y;

    if (Math.random() <= 0.5) {
      x = Math.random() <= 0.5 ? 0 - radius : canvasWidth + radius;
      y = Math.random() * canvasHeight;
    } else {
      x = Math.random() * canvasWidth;
      y = Math.random() <= 0.5 ? 0 - radius : canvasHeight + radius;
    }

    const color = `hsl(${Math.random() * 360}, 50%, 50%)`;

    const angle = Math.atan2(centerY - y, centerX - x);

    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, enemyEachTime);
}

function updateScore(value: number) {
  score += value;
  if (scoreEl) scoreEl.innerText = `${score}`;
}

function shrinkEnemy(enemy: Enemy, i: number) {
  gsap.to(enemy, {
    radius: enemy.radius - 10,
  });
  setTimeout(() => {
    projectiles.splice(i, 1);
  }, 0);
}

function deleteEnemy(iEnemy: number, iProjectile: number) {
  setTimeout(() => {
    enemies.splice(iEnemy, 1);
    projectiles.splice(iProjectile, 1);
  }, 0);
}

declare const gsap: any;
let animationId: number;

function animate() {
  animationId = requestAnimationFrame(animate);
  context.fillStyle = 'rgba(0, 0, 0, 0.1)';
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  player.draw();

  particles.forEach((particle, i) => {
    if (particle.alpha <= 0) particles.splice(i, 1);
    else particle.update();
  });

  projectiles.forEach((projectile, iProjectile) => {
    projectile.update();

    // Removing projectiles
    if (
      projectile.x + projectile.radius < 0 ||
      projectile.x - projectile.radius > canvasWidth ||
      projectile.y + projectile.radius < 0 ||
      projectile.y - projectile.radius > canvasWidth
    ) {
      setTimeout(() => {
        projectiles.splice(iProjectile, 1);
      }, 0);
    }
  });
  enemies.forEach((enemy, iEnemy) => {
    enemy.update();

    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    // End game
    if (dist - enemy.radius - player.radius < 1) {
      cancelAnimationFrame(animationId);
      if (scoreBoard) {
        scoreBoard.style.display = 'flex';
        const finalScore = scoreBoard.querySelector('h1');
        if (finalScore) finalScore.innerText = `${score}`;
      }
    }

    projectiles.forEach((projectile, iProjectile) => {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

      // Object Touch
      if (dist - enemy.radius - projectile.radius < 1) {
        // Create explosions
        for (let i = 0; i < enemy.radius * 1.5; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 2,
              enemy.color,
              {
                x: (Math.random() - 0.5) * (Math.random() * 6),
                y: (Math.random() - 0.5) * (Math.random() * 6),
              },
            ),
          );
        }

        // Shrinking
        if (enemy.radius - 10 > 5) {
          // Increase score
          updateScore(100);
          shrinkEnemy(enemy, iProjectile);
        } else {
          // Delete Enemy
          updateScore(250);
          deleteEnemy(iEnemy, iProjectile);
          // Setting difficulty
          if (enemyEachTime != 500) if (score > 10000) enemyEachTime = 500;
        }
      }
    });
  });
}

// Shoot
addEventListener('click', (e) => {
  const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
  const speed = 6;
  const velocity = {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed,
  };
  projectiles.push(new Projectile(centerX, centerY, 5, 'white', velocity));
});

// Start Game
startGameButton?.addEventListener('click', () => {
  init();
  animate();
  spawnEnemies();
  if (scoreBoard) scoreBoard.style.display = 'none';
});

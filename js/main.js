const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Variables
let score;
let scoreText;
let highscore;
let highscoreText;
let player;
let gravity;
let obstacles = [];
let gameSpeed;
let keys = {};

// Event Listeners
document.addEventListener('keydown', function (event) { // button press 
  keys[event.code] = true;
});
document.addEventListener('keyup', function (event) { // button release
  keys[event.code] = false;
});

// player parameters
class Player {
  constructor (x, y, w, h, c) {
    this.x = x; // x position
    this.y = y; // y position
    this.w = w; // width
    this.h = h; // height
    this.c = c; // color

    this.dy = 0; // direction y jump velocity
    this.jumpForce = 9;  // jump height
    this.originalHeight = h;  //reference for when shrinking character to duck
    this.grounded = false;
    this.jumpTimer = 0;   // when holding jump, jumps higher
  }

  // Animate controls movement of character
  Animate () { 
    // Jump when pressing space, w, or up arrow
    if (keys['Space'] || keys['KeyW'] || keys['ArrowUp']) {
      this.Jump();
    } else {
      this.jumpTimer = 0;
    }
    
    // Duck when pressing down arrow or s
    if (keys['ArrowDown'] || keys['KeyS']) {
      this.h = this.originalHeight / 2;  // halves height of character
    } else {
      this.h = this.originalHeight;  // character returns to original height when key is released
    }

    this.y += this.dy;   // has to be above gravity because gravity will check 

    // Gravity
    if (this.y + this.h < canvas.height) {  //  slowly gets momentum as 
      this.dy += gravity;                    //  the square falls
      this.grounded = false;
    } else {
      this.dy = 0;                          // no velocity
      this.grounded = true;
      this.y = canvas.height - this.h;
    }

    this.Draw();
  }

    // 
  Jump () {
    if (this.grounded && this.jumpTimer == 0) {
      this.jumpTimer = 1;  
      this.dy = -this.jumpForce;
    } else if (this.jumpTimer > 0 && this.jumpTimer < 15) {
      this.jumpTimer++;
      this.dy = -this.jumpForce - (this.jumpTimer / 50);
    }
  }

  // Draws character
  Draw () {
    ctx.beginPath();
    ctx.fillStyle = this.c; // filled in color
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.closePath();
  }
}

// squares that player has to dodge
class Obstacle {
  constructor (x, y, w, h, c) {
    this.x = x;  // x position
    this.y = y;  // y position
    this.w = w;  // width
    this.h = h;  // height 
    this.c = c;  // color

    this.dx = -gameSpeed;  // velocity of x positions
  }

  Update () {
    this.x += this.dx;
    this.Draw();
    this.dx = -gameSpeed;  // obstacles slowly get faster (minus gamespeed because x position value lessens as object moves towards the left)
  }

  // draws obstacles
  Draw () {
    ctx.beginPath();
    ctx.fillStyle = this.c;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.closePath();
  }
}

class Text {
  constructor (t, x, y, a, c, s) {
    this.t = t;  // text
    this.x = x;  // x position
    this.y = y;  // y position
    this.a = a;  // text alignment
    this.c = c;  // text color
    this.s = s;  // text size
  }

  // draws text
  Draw () {
    ctx.beginPath();
    ctx.fillStyle = this.c;
    ctx.font = this.s + "px sans-serif";
    ctx.textAlign = this.a;
    ctx.fillText(this.t, this.x, this.y);
    ctx.closePath();
  }
}

// Game Functions
function SpawnObstacle () {  // spawns obstacles
  let size = RandomIntInRange(20, 70);  // creates square of random size between 20 or 70 high
  let type = RandomIntInRange(0, 1);  // 0 is square on the ground to jump over 1 is floating square to duck under
  let obstacle = new Obstacle(canvas.width + size, canvas.height - size, size, size, 'black');

  if (type == 1) {
    obstacle.y -= player.originalHeight - 10;   // floating obstacle makes it so that its 10 less than the player so player has to jump or dodge
  }
  obstacles.push(obstacle);
}


function RandomIntInRange (min, max) {
  return Math.round(Math.random() * (max - min) + min);  // rounds number to the nearest number to get range between 20 and 70
}

function Start () {
  ctx.font = "20px sans-serif";

  gameSpeed = 3;
  gravity = 1;

  score = 0;
  highscore = 0;

  // saves high score on refresh
  // if (localStorage.getItem('highscore')) {
  //   highscore = localStorage.getItem('highscore');
  // }

  player = new Player(25, 0, 50, 50, 'green'); // this is the player a green square

  scoreText = new Text("Score: " + score, 25, 25, "left", "#212121", "20");
  highscoreText = new Text("High Score: " + highscore, canvas.width - 25, 25, "right", "#212121", "20");

  requestAnimationFrame(Update); // calls function update
}

let initialSpawnTimer = 150;  // rate at which obstacles spawn
let spawnTimer = initialSpawnTimer;
function Update () {        
  requestAnimationFrame(Update);
  ctx.clearRect(0, 0, canvas.width, canvas.height);   // clears the canvas every frame, if not cleared then the canvas draws the square without refreshing which would leave long rectangles

  spawnTimer--;
  if (spawnTimer <= 0) {
    SpawnObstacle();
    console.log(obstacles);
    spawnTimer = initialSpawnTimer - gameSpeed * 8;  // makes game speed faster, spawns obstacles quicker over time
    
    if (spawnTimer < 60) {
      spawnTimer = 60;
    }
  }

  // Spawn Enemies
  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];

    if (o.x + o.w < 0) {        
      obstacles.splice(i, 1);  // when object leaves screen it gets deleted
    }

    // collison detection
    if (
      player.x < o.x + o.w &&          // if player x position is less than obstacle x position and
      player.x + player.w > o.x &&     // if player x pos plus player width is greater than object x pos and
      player.y < o.y + o.h &&          // if player y pos is less than object y position plus object height and
      player.y + player.h > o.y        // if player y pos plus player height is greater than object y position
    ) {                                // calls for game reset on hit
      obstacles = [];
      score = 0;  // when player gets hit reset the score to 0
      spawnTimer = initialSpawnTimer;  // reset spawn timer
      gameSpeed = 3;
      window.localStorage.setItem('highscore', highscore);  // saves highscore
    }

    o.Update();
  }

  player.Animate();

  score++;
  scoreText.t = "Score: " + score;  // counts score
  scoreText.Draw();  // draws score on canvas

  if (score > highscore) {    // if score is greater than high score then
    highscore = score;        // high score and score are equal and counts
    highscoreText.t = "High Score: " + highscore;  // counts high score
  }
  
  highscoreText.Draw();  // draws high score on canvas

  gameSpeed += 0.003; // game gets faster slowly building up speed of .003
}

Start();
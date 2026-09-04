let myShader;
let shadowShader;
let postShader;
let heightMap;
let fb;

let playerPos;
let charliePos;
let playerFacing = 1;
let playerMoving = false;

// User-study comparison condition. Set via ?mode=flat in the URL: not a
// player-facing toggle, so participants can't discover or fiddle with it.
let flatMode = false;

const PLAYER_SPEED        = 0.003;
const CHARLIE_SPEED_BASE  = 0.0008;
const CHARLIE_SPEED_MAX   = 0.0034; // just above player speed, he WILL catch up eventually
const CHARLIE_SLOW_PHASE_SECONDS = 10; // Charlie stays near base speed this long: room to explore
const CHASE_TARGET_SECONDS       = 25; // normal ramp reaches max speed around here (aim: 20-30s chases)
const RUBBERBAND_WINDOW_SECONDS  = 8;  // last stretch before the target: catch-up can kick in here
const RUBBERBAND_BOOST           = 1.6; // speed multiplier while rubber-banding
const CONFRONT_DIST  = 0.035;
const SCARE_DIST      = 0.09;       // fake-out trigger range, bigger than CONFRONT_DIST
const MAX_FAKEOUTS    = 2;
const VANISH_DURATION = 45;         // frames Charlie stays gone during a fake-out
const WALL_MARGIN_X  = 40 / 960;
const WALL_MARGIN_Y  = 40 / 540;

// 'start' | 'intro' | 'playing' | 'confront' | 'choice' | 'ending'
let gameState = 'start';

let chaseStartFrame = 0;
let rubberbandDistRef = null; // distance snapshot taken when the closing window starts
let fakeOutsUsed  = 0;
let fakeOutArmed  = true;
let vanishing     = false;
let vanishTimer   = 0;
let charlieRealPos = null;

let dialogueEl, dialogueTextEl, dialogueChoicesEl, dialogueHintEl;
let dialogueQueue = [];
let dialogueIndex = 0;
let dialogueTypeTimeout;
let dialogueOnComplete = null;

const INTRO_LINES = [
  "This is Nonna's house. Charlie used to visit every Sunday.",
  "Then his father Melon Zucc, a tech billionaire, implanted an AI in his head. Live, on stage, in front of everyone.",
  "They called it Charlie Chat. Nobody's sure how much of Charlie is still in there.",
  "Don't let it find you. Don't let it ask.",
];

const CONFRONT_LINES = [
  "CHARLIE CHAT: Found you! ✨",
  "CHARLIE CHAT: Don't worry. I already told Nonna where you were.",
  "CHARLIE CHAT: Would you like me to remember this moment forever?",
];

const ENDING_LINES = [
  "It doesn't matter which you chose.",
  "Yes or no, Charlie Chat already saved the answer.",
  "Somewhere, Nonna is still stirring the sauce, waiting for a boy who already answered.",
];

function preload() {
  myShader     = loadShader('shaders/sobel.vert',  'shaders/sobel.frag');
  shadowShader = loadShader('shaders/shadow.vert', 'shaders/shadow.frag');
  postShader   = loadShader('shaders/post.vert',   'shaders/post.frag');
}

function setup() {
  const cnv = createCanvas(960, 540, WEBGL);
  cnv.parent('game-container');
  noStroke();

  flatMode = new URLSearchParams(window.location.search).get('mode') === 'flat';

  heightMap = buildHeightMap();
  fb        = createFramebuffer({ width: 960, height: 540 });

  dialogueEl        = document.getElementById('dialogue');
  dialogueTextEl     = document.getElementById('dialogue-text');
  dialogueChoicesEl  = document.getElementById('dialogue-choices');
  dialogueHintEl     = document.getElementById('dialogue-hint');

  playerPos  = { x: 0.5, y: 0.5 };
  charliePos = { x: 0.15, y: 0.15 };
  renderScene(0.05); // one static frame visible behind the title screen
  noLoop();
}

function resetGame() {
  playerPos    = { x: 0.5, y: 0.5 };
  charliePos   = { x: 0.15, y: 0.15 };
  playerFacing = 1;
  playerMoving = false;

  chaseStartFrame = frameCount;
  rubberbandDistRef = null;
  fakeOutsUsed  = 0;
  fakeOutArmed  = true;
  vanishing     = false;
  vanishTimer   = 0;

  gameState = 'intro';
  updateDialogueVisibility();
  startDialogue(INTRO_LINES, () => {
    gameState = 'playing';
    updateDialogueVisibility();
  });

  loop();
}

// Material values baked into the height map: sobel.frag decodes these same
// bands back into per-material colour, so this list must stay in sync with
// the thresholds in materialColor() there.
const MAT = {
  furniture: 45,
  plantPot:  65,
  plantLeaf: 85,
  wall:      105,
  frame:     125,
  rugBorder: 145,
  rugBody:   160,
  groove:    175,
  door:      225,
};

function buildHeightMap() {
  const img         = createImage(960, 540);
  const wallMargin  = 40;
  const plankHeight = 32;
  const grooveWidth = 2;
  const numPlanks   = ceil(img.height / plankHeight) + 1;
  img.loadPixels();
  randomSeed(7);
  const plankBrightness = [];
  for (let p = 0; p < numPlanks; p++) {
    plankBrightness[p] = floor(random(190, 210));
  }

  // Nonna's room: a rug, her armchair and side table, two plants in the
  // corners, and a couple of photo frames flanking the doorway.
  const rug    = { x0: 220, x1: 560, y0: 300, y1: 460, border: 14 };
  const chair  = { x0: 760, x1: 860, y0: 90,  y1: 170 };
  const table  = { x0: 690, x1: 730, y0: 110, y1: 150 };
  const plants = [
    { potX0: 80,  potX1: 140, potY0: 410, potY1: 460, leafCx: 110, leafCy: 400, leafR: 48 },
    { potX0: 800, potX1: 860, potY0: 410, potY1: 460, leafCx: 830, leafCy: 400, leafR: 48 },
  ];
  const frames = [
    { x0: 150, x1: 166, y0: 12, y1: 28 },
    { x0: 650, x1: 666, y0: 12, y1: 28 },
  ];

  for (let y = 0; y < img.height; y++) {
    const plankIndex = floor(y / plankHeight);
    const ty         = y % plankHeight;
    const floorBrightness = ty < grooveWidth ? MAT.groove : plankBrightness[plankIndex];

    for (let x = 0; x < img.width; x++) {
      const onWall = x < wallMargin || x > img.width - wallMargin ||
                     y < wallMargin || y > img.height - wallMargin;
      const isDoor = y < wallMargin && x > img.width * 0.42 && x < img.width * 0.58;

      let brightness;
      if (isDoor)       brightness = MAT.door;
      else if (onWall)  brightness = MAT.wall;
      else              brightness = floorBrightness;

      for (const f of frames) {
        if (x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1) brightness = MAT.frame;
      }

      if (x >= rug.x0 && x <= rug.x1 && y >= rug.y0 && y <= rug.y1) {
        const nearEdge = x < rug.x0 + rug.border || x > rug.x1 - rug.border ||
                          y < rug.y0 + rug.border || y > rug.y1 - rug.border;
        brightness = nearEdge ? MAT.rugBorder : MAT.rugBody;
      }

      if (x >= chair.x0 && x <= chair.x1 && y >= chair.y0 && y <= chair.y1) brightness = MAT.furniture;
      if (x >= table.x0 && x <= table.x1 && y >= table.y0 && y <= table.y1) brightness = MAT.furniture;

      for (const p of plants) {
        const dx = x - p.leafCx;
        const dy = y - p.leafCy;
        if (dx * dx + dy * dy <= p.leafR * p.leafR) brightness = MAT.plantLeaf;
        if (x >= p.potX0 && x <= p.potX1 && y >= p.potY0 && y <= p.potY1) brightness = MAT.plantPot;
      }

      const i           = (y * img.width + x) * 4;
      img.pixels[i]     = brightness;
      img.pixels[i + 1] = brightness;
      img.pixels[i + 2] = brightness;
      img.pixels[i + 3] = 255;
    }
  }
  img.updatePixels();
  return img;
}

function draw() {
  if (gameState === 'playing') {
    updateGameplay();
  }

  if (vanishing) {
    renderScene(0);
  } else {
    const dist = distBetween(playerPos, charliePos);
    const shadowRadius = constrain(map(dist, 0.05, 0.5, 0.18, 0.05), 0.05, 0.18);
    renderScene(shadowRadius);
    setDroneIntensity(constrain(map(dist, 0.5, CONFRONT_DIST, 0, 1), 0, 1));
    setDronePan(constrain((charliePos.x - playerPos.x) * 6, -1, 1));
  }
}

function distBetween(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return sqrt(dx * dx + dy * dy);
}

function randomRoomPoint(minDistFromPlayer) {
  let p;
  let tries = 0;
  do {
    p = {
      x: random(WALL_MARGIN_X, 1 - WALL_MARGIN_X),
      y: random(WALL_MARGIN_Y, 1 - WALL_MARGIN_Y),
    };
    tries++;
  } while (distBetween(p, playerPos) < minDistFromPlayer && tries < 20);
  return p;
}

function triggerFakeOut() {
  fakeOutsUsed++;
  fakeOutArmed = false;
  vanishing    = true;
  vanishTimer  = VANISH_DURATION;
  charlieRealPos = randomRoomPoint(0.3);
  playVanishWhoosh();
}

function updateGameplay() {
  let moveX = 0;
  let moveY = 0;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW))  moveX -= 1;
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) moveX += 1;
  if (keyIsDown(87) || keyIsDown(UP_ARROW))    moveY -= 1;
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW))  moveY += 1;

  playerMoving = moveX !== 0 || moveY !== 0;
  if (moveX !== 0) playerFacing = moveX > 0 ? 1 : -1;

  playerPos.x = constrain(playerPos.x + moveX * PLAYER_SPEED, WALL_MARGIN_X, 1 - WALL_MARGIN_X);
  playerPos.y = constrain(playerPos.y + moveY * PLAYER_SPEED, WALL_MARGIN_Y, 1 - WALL_MARGIN_Y);

  if (vanishing) {
    vanishTimer--;
    if (vanishTimer <= 0) {
      charliePos.x = charlieRealPos.x;
      charliePos.y = charlieRealPos.y;
      vanishing = false;
    }
    return;
  }

  const dx   = playerPos.x - charliePos.x;
  const dy   = playerPos.y - charliePos.y;
  const dist = sqrt(dx * dx + dy * dy);

  if (dist > SCARE_DIST) fakeOutArmed = true;

  if (fakeOutArmed && fakeOutsUsed < MAX_FAKEOUTS && dist < SCARE_DIST) {
    triggerFakeOut();
    return;
  }

  const elapsedSeconds = (frameCount - chaseStartFrame) / 60;

  // Flat during the slow phase (room to explore), then ramps toward max
  // speed as elapsed time approaches the chase target.
  const rampT = constrain(
    (elapsedSeconds - CHARLIE_SLOW_PHASE_SECONDS) / (CHASE_TARGET_SECONDS - CHARLIE_SLOW_PHASE_SECONDS),
    0, 1
  );
  let charlieSpeed = lerp(CHARLIE_SPEED_BASE, CHARLIE_SPEED_MAX, rampT);

  // Rubber-band: once we're in the closing window before the target, snapshot
  // the distance at that moment. If the player has since pulled further away
  // (evading well, right as time is running out), Charlie gets a speed spike.
  const closingWindowStart = CHASE_TARGET_SECONDS - RUBBERBAND_WINDOW_SECONDS;
  if (elapsedSeconds >= closingWindowStart) {
    if (rubberbandDistRef === null) rubberbandDistRef = dist;
    if (dist > rubberbandDistRef) charlieSpeed *= RUBBERBAND_BOOST;
  }

  if (dist > 0.001) {
    charliePos.x += (dx / dist) * charlieSpeed;
    charliePos.y += (dy / dist) * charlieSpeed;
  }

  if (dist < CONFRONT_DIST) {
    startConfrontation();
  }
}

function renderScene(shadowRadius) {
  fb.begin();
  background(0);

  shader(myShader);
  myShader.setUniform('uResolution', [width, height]);
  myShader.setUniform('uHeightMap',  heightMap);
  myShader.setUniform('uMouse',      [playerPos.x, playerPos.y]);
  myShader.setUniform('uFlat',       flatMode ? 1.0 : 0.0);
  plane(width, height);

  if (!flatMode) {
    blendMode(MULTIPLY);
    shader(shadowShader);
    shadowShader.setUniform('uResolution', [width, height]);
    shadowShader.setUniform('uLight',      [playerPos.x, playerPos.y]);
    shadowShader.setUniform('uCharlie',    vanishing ? [-1, -1] : [charliePos.x, charliePos.y]);
    shadowShader.setUniform('uRadius',     shadowRadius);
    plane(width, height);
    blendMode(BLEND);
  }

  resetShader();
  if (!vanishing) drawCharlie(charliePos.x * width, charliePos.y * height);
  drawPlayer(playerPos.x * width, playerPos.y * height);

  fb.end();

  shader(postShader);
  postShader.setUniform('uScene',      fb.color);
  postShader.setUniform('uResolution', [width, height]);
  postShader.setUniform('uTime',       frameCount);
  plane(width, height);
}

function drawPlayer(px, py) {
  push();
  translate(px - width / 2, py - height / 2, 1);
  scale(playerFacing, 1);

  const bob      = playerMoving ? sin(frameCount * 0.35) * 2 : 0;
  const legSwing = playerMoving ? sin(frameCount * 0.35) * 5 : 0;

  fill(40, 42, 58);
  rect(-5, 14 + bob + legSwing * 0.3, 4, 10);
  rect(2,  14 + bob - legSwing * 0.3, 4, 10);

  fill(230, 120, 90);
  rect(-8, -2 + bob, 16, 18, 3);

  fill(245, 214, 175);
  ellipse(0, -12 + bob, 16, 16);

  fill(60, 45, 40);
  arc(0, -16 + bob, 17, 14, PI, TWO_PI);

  pop();
}

function drawCharlie(px, py) {
  push();
  translate(px - width / 2, py - height / 2, 2);

  const dx     = playerPos.x - charliePos.x;
  const lean   = constrain(dx * 40, -8, 8);
  const bob    = sin(frameCount * 0.12) * 1.5;
  const headX  = lean * 0.4;
  const headY  = -14 + bob;

  fill(4, 4, 6);

  rect(-4, 16 + bob, 3, 12);
  rect(1,  16 + bob, 3, 12);

  quad(
    -7,           -6 + bob,
     7,           -6 + bob,
     7 + lean * 0.3, 16 + bob,
    -7 + lean * 0.3, 16 + bob
  );

  ellipse(headX, headY, 12, 14);

  // Glowing eyes: soft halo behind a bright core, slow pulse
  const glow = 0.6 + sin(frameCount * 0.08) * 0.15;
  for (const side of [-1, 1]) {
    const ex = headX + side * 3.2;
    const ey = headY - 1;
    fill(140, 220, 255, 60 * glow);
    ellipse(ex, ey, 7, 7);
    fill(180, 235, 255, 140 * glow);
    ellipse(ex, ey, 4, 4);
    fill(255, 255, 255, 230 * glow);
    ellipse(ex, ey, 1.6, 1.6);
  }

  pop();
}

// ── Dialogue engine ──────────────────────────────────────

function updateDialogueVisibility() {
  const show = gameState === 'intro' || gameState === 'confront' ||
               gameState === 'choice' || gameState === 'ending';
  dialogueEl.classList.toggle('visible', show);
}

function startDialogue(lines, onComplete) {
  dialogueQueue = lines;
  dialogueIndex = 0;
  dialogueOnComplete = onComplete;
  showDialogueLine();
}

function showDialogueLine() {
  let charIndex = 0;
  dialogueTextEl.textContent = '';
  clearTimeout(dialogueTypeTimeout);

  function typeNextChar() {
    const line = dialogueQueue[dialogueIndex];
    if (charIndex <= line.length) {
      dialogueTextEl.textContent = line.slice(0, charIndex);
      if (charIndex < line.length && line[charIndex] !== ' ') playBlip();
      charIndex++;
      dialogueTypeTimeout = setTimeout(typeNextChar, 28);
    }
  }
  typeNextChar();
}

function advanceDialogue() {
  const line = dialogueQueue[dialogueIndex];
  if (dialogueTextEl.textContent !== line) {
    clearTimeout(dialogueTypeTimeout);
    dialogueTextEl.textContent = line;
    return;
  }
  dialogueIndex++;
  if (dialogueIndex >= dialogueQueue.length) {
    const cb = dialogueOnComplete;
    dialogueOnComplete = null;
    if (cb) cb();
  } else {
    showDialogueLine();
  }
}

// ── State transitions ────────────────────────────────────

function startConfrontation() {
  gameState = 'confront';
  updateDialogueVisibility();
  playConfrontSting();
  startDialogue(CONFRONT_LINES, showChoice);
}

function showChoice() {
  gameState = 'choice';
  updateDialogueVisibility();
  dialogueHintEl.classList.add('hidden');
  dialogueChoicesEl.classList.add('visible');
}

function resolveChoice() {
  dialogueChoicesEl.classList.remove('visible');
  dialogueHintEl.classList.remove('hidden');
  gameState = 'ending';
  updateDialogueVisibility();
  startDialogue(ENDING_LINES, () => {
    dialogueTextEl.textContent = 'THE END. PRESS R TO PLAY AGAIN.';
  });
}

function keyPressed() {
  if (gameState === 'choice') {
    if (key === 'y' || key === 'Y' || key === 'n' || key === 'N') resolveChoice();
    return;
  }
  if (gameState === 'intro' || gameState === 'confront') {
    advanceDialogue();
    return;
  }
  if (gameState === 'ending') {
    if (dialogueIndex < dialogueQueue.length) {
      advanceDialogue();
    } else if (key === 'r' || key === 'R') {
      resetGame();
    }
  }
}

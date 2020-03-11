const scorePanel = document.querySelector(".status__scorePanel .panel-content");
const levelPanel = document.querySelector(".status__levelPanel .panel-content");
const startBtn = document.querySelector(".gameBtn.startBtn");
const restartBtn = document.querySelector(".gameBtn.restartBtn");

const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 26;

/*canvas 설정*/
const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 540;
const BLOCK_WIDTH = 20;
const BLOCK_HEIGHT = 20;
const CANVAS_WIDTH_PADDING = (CANVAS_WIDTH - BLOCK_WIDTH * BOARD_WIDTH) / 2;
const CANVAS_HEIGHT_PADDING = 20;

const KEY_SPACEBAR = 32;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;

const SCORE_INDEX = [250, 500, 1000, 2000];
const SPEED_INTERVAL = [600, 520, 400, 290, 180];
const LEVEL_SCORE = [2000, 5000, 10000, 15000];
const MAX_LEVEL = LEVEL_SCORE.length + 1;

const SHAPE_INDEX = [
  "ZSHAPE",
  "SSHAPE",
  "LINESHAPE",
  "TSHAPE",
  "SQUARE",
  "LSHAPE",
  "MIRROREDLSHAPE"
];

const COLOR_ARR = [
  "none",
  "#ff7675",
  "#ffeaa7",
  "#fdcb6e",
  "#81ecec",
  "#0984e3",
  "#e056fd"
];

const BLOCK_SHAPE = {
  ZSHAPE: [
    [0, -1],
    [0, 0],
    [-1, 0],
    [-1, 1]
  ],
  SSHAPE: [
    [-1, -1],
    [-1, 0],
    [0, 0],
    [0, 1]
  ],
  LINESHAPE: [
    [0, -1],
    [0, 0],
    [0, 1],
    [0, 2]
  ],
  TSHAPE: [
    [-1, 0],
    [0, 0],
    [1, 0],
    [0, 1]
  ],
  SQUARE: [
    [-1, 0],
    [0, 0],
    [0, 1],
    [-1, 1]
  ],
  LSHAPE: [
    [-1, -1],
    [-1, 0],
    [0, 0],
    [1, 0]
  ],
  MIRROREDLSHAPE: [
    [-1, 0],
    [0, 0],
    [1, 0],
    [1, -1]
  ]
};

let gameInterval = null;
let currentScore = 0;
let currentLevel = 1;
let currentBlock = new Object();
let board = new Array(BOARD_WIDTH)
  .fill(0)
  .map(() => Array(BOARD_HEIGHT).fill(0));

function getNextShape() {
  const result = parseInt((Math.random() * 10) % 7);
  currentBlock["shape"] = result;
  return result;
}

function drawBlock() {
  for (let i = 0; i < 4; i++) {
    drawOneRect(
      {
        x: currentBlock.blockPos.x + currentBlock.coords[i][0],
        y: currentBlock.blockPos.y + currentBlock.coords[i][1]
      },
      currentBlock.color
    );
  }
}

function clearBlock() {
  for (let i = 0; i < 4; i++) {
    clearOneRect({
      x: currentBlock.blockPos.x + currentBlock.coords[i][0],
      y: currentBlock.blockPos.y + currentBlock.coords[i][1]
    });
  }
}

function drawOneRect(pos, color) {
  ctx.fillStyle = COLOR_ARR[color];
  ctx.fillRect(
    pos.x * BLOCK_WIDTH + CANVAS_WIDTH_PADDING,
    pos.y * BLOCK_HEIGHT,
    BLOCK_WIDTH,
    BLOCK_HEIGHT
  );

  ctx.lineWidth = 1;
  ctx.strokeStyle = "lightgray";
  ctx.strokeRect(
    pos.x * BLOCK_WIDTH + CANVAS_WIDTH_PADDING,
    pos.y * BLOCK_HEIGHT,
    BLOCK_WIDTH,
    BLOCK_HEIGHT
  );
}

function clearOneRect(pos) {
  ctx.clearRect(
    pos.x * BLOCK_WIDTH - 1 + CANVAS_WIDTH_PADDING,
    pos.y * BLOCK_HEIGHT - 1,
    BLOCK_WIDTH + 2,
    BLOCK_HEIGHT + 2
  );
}

function drawMap() {
  for (let x = 0; x < BOARD_WIDTH; x++) {
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (board[x][y] !== 0) drawOneRect({ x, y }, board[x][y]);
      else clearOneRect({ x, y });
    }
  }
}

function levelUp() {
  currentLevel++;
  levelPanel.innerText = currentLevel;
  clearInterval(gameInterval);
  blockDown(SPEED_INTERVAL[currentLevel - 1]);
}

function checkLevel() {
  if (currentLevel === MAX_LEVEL) return;
  if (currentScore >= LEVEL_SCORE[currentLevel - 1]) levelUp();
}

function addScore(score) {
  currentScore += score;
  scorePanel.innerText = currentScore;
  checkLevel();
}

function removeLine() {
  const removeSet = new Set(); //배열 대신 중복을 허용하지 않는 Set, Map 콜렉션으로 변경
  let checkPosX;
  // 제거할 라인 검색
  for (let i = 0; i < currentBlock.coords.length; i++) {
    checkPosX = -1;
    if (removeSet.has(currentBlock.blockPos.y + currentBlock.coords[i][1]))
      continue;
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (board[x][currentBlock.blockPos.y + currentBlock.coords[i][1]] === 0) {
        checkPosX = x;
        break;
      }
    }
    if (checkPosX === -1)
      removeSet.add(currentBlock.blockPos.y + currentBlock.coords[i][1]);
  }
  // 제거할 블록이 없는 경우 종료
  if (removeSet.size === 0) return;

  // 블록 제거
  const removeArr = [...removeSet];
  const score = SCORE_INDEX[removeArr.length - 1];

  removeArr.sort((a, b) => b - a);
  for (let i = 0; i < removeArr.length; i++) {
    for (let x = 0; x < BOARD_WIDTH; x++) board[x][removeArr[i]] = 0;
  }
  let fillIndex = removeArr.shift();
  for (let i = fillIndex - 1; i >= 0; i--) {
    if (removeSet.has(i)) continue;
    for (let x = 0; x < BOARD_WIDTH; x++) {
      board[x][fillIndex] = board[x][i];
      board[x][i] = 0;
    }
    removeArr.push(i);
    if (removeArr.length !== 0) fillIndex = removeArr.shift();
    else fillIndex;
  }
  // 맵 수정
  addScore(score);
  drawMap();
}

function isCrashing(pos, coords) {
  for (let i = 0; i < 4; i++) {
    const x = pos.x + coords[i][0];
    const y = pos.y + coords[i][1];
    // 벽충돌체크
    if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT || y < 0) return true;
    // 다른 블록과의 충돌체크
    if (board[x][y] !== 0) return true;
  }
  return false;
}

function rotate() {
  if (currentBlock.shape === 4) return; //BLOCK이 SQUARE SHAPE인 경우 회전x
  const coords = [];
  for (let i = 0; i < 4; i++) {
    const temp = [];
    temp.push(currentBlock.coords[i][0]);
    temp.push(currentBlock.coords[i][1]);
    coords.push(temp);
  }
  for (let i = 0; i < 4; i++) {
    const x = coords[i][0];
    const y = coords[i][1];
    coords[i][0] = -y;
    coords[i][1] = x;
  }

  if (
    !isCrashing(
      { x: currentBlock.blockPos.x, y: currentBlock.blockPos.y },
      coords
    )
  ) {
    clearBlock();
    currentBlock.coords = coords;
    drawBlock();
  }
}

function moveBlockLeft() {
  if (
    !isCrashing(
      { x: currentBlock.blockPos.x - 1, y: currentBlock.blockPos.y },
      currentBlock.coords
    )
  ) {
    clearBlock();
    currentBlock.blockPos.x -= 1;
    drawBlock();
  }
}

function moveBlockRight() {
  if (
    !isCrashing(
      { x: currentBlock.blockPos.x + 1, y: currentBlock.blockPos.y },
      currentBlock.coords
    )
  ) {
    clearBlock();
    currentBlock.blockPos.x += 1;
    drawBlock();
  }
}

function moveBlockDown() {
  if (
    !isCrashing(
      { x: currentBlock.blockPos.x, y: currentBlock.blockPos.y + 1 },
      currentBlock.coords
    )
  ) {
    clearBlock();
    currentBlock.blockPos.y += 1;
    drawBlock();
  }
}

function hardDrop() {
  clearBlock();
  while (
    !isCrashing(
      { x: currentBlock.blockPos.x, y: currentBlock.blockPos.y + 1 },
      currentBlock.coords
    )
  ) {
    currentBlock.blockPos.y += 1;
  }
  drawBlock();
}

function onKeyDown(e) {
  if (e.keyCode === KEY_LEFT) {
    //left
    moveBlockLeft();
  } else if (e.keyCode === KEY_UP) {
    //up
    rotate();
  } else if (e.keyCode === KEY_RIGHT) {
    //right
    moveBlockRight();
  } else if (e.keyCode === KEY_DOWN) {
    //down
    moveBlockDown();
  } else if (e.keyCode === KEY_SPACEBAR) {
    //hard drop
    hardDrop();
  }
}

function blockDown(interval) {
  gameInterval = setInterval(() => {
    if (
      !isCrashing(
        { x: currentBlock.blockPos.x, y: currentBlock.blockPos.y + 1 },
        currentBlock.coords
      )
    ) {
      clearBlock(currentBlock.blockPos);
      currentBlock.blockPos.y += 1;
      drawBlock(currentBlock.blockPos);
    } else {
      currentBlock.coords.forEach(e => {
        board[currentBlock.blockPos.x + e[0]][currentBlock.blockPos.y + e[1]] =
          currentBlock.color; //TODO board 값을 컬러코드로 수정하기
      });
      removeLine();
      if (initBlock()) drawBlock(currentBlock.blockPos);
    }
  }, interval);
}

function gameOver() {
  clearInterval(gameInterval);
  ctx.fillStyle = "black";
  ctx.fillText("Game Over", 53, 60);
  showNode(restartBtn);
}

//@@TOTO클래스 또는 생성자 함수로 코드변경후 유지,보수성 향상 ㄱ
function initBlock() {
  const shape = getNextShape();
  currentBlock["blockPos"] = { x: BOARD_WIDTH / 2, y: 2 };
  currentBlock["coords"] = BLOCK_SHAPE[SHAPE_INDEX[shape]];
  currentBlock["shape"] = shape;
  currentBlock["color"] = parseInt(
    ((Math.random() * 10) % (COLOR_ARR.length - 1)) + 1
  );

  //생성한 블럭위치에 이미 다른 블럭으로 채워진 경우 GAMEOVER
  if (
    isCrashing(
      { x: currentBlock.blockPos.x, y: currentBlock.blockPos.y },
      currentBlock.coords
    )
  ) {
    gameOver();
    return false;
  }
}

function initBoard() {
  board = board.map(e => {
    return e.map(() => 0);
  });
}

function canvasInit() {
  // 초기 CANVAS 설정
  gameCanvas.width = CANVAS_WIDTH;
  gameCanvas.height = CANVAS_HEIGHT;
  ctx.globalCompositeOperation = "source-over";
  ctx.font = "48px sans-serif";

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = "rgba(149, 165, 166, 1)";
  ctx.moveTo(CANVAS_WIDTH_PADDING - 2, 0);
  ctx.lineTo(
    CANVAS_WIDTH_PADDING - 2,
    CANVAS_HEIGHT - CANVAS_HEIGHT_PADDING + 2
  );
  ctx.lineTo(
    CANVAS_WIDTH - CANVAS_WIDTH_PADDING + 2,
    CANVAS_HEIGHT - CANVAS_HEIGHT_PADDING + 2
  );
  ctx.lineTo(CANVAS_WIDTH - CANVAS_WIDTH_PADDING + 2, 0);
  ctx.stroke();
}

function gameStart() {
  canvasInit();
  // 블록초기화
  initBlock();
  // 블록내리기
  blockDown(SPEED_INTERVAL[0]);
}

function showNode(node) {
  node.classList.remove("hidden");
}

function removeNode(node) {
  node.classList.add("hidden");
}

function handleClickStartBtn() {
  removeNode(startBtn);
  gameStart();
}

function handleClickRestartBtn() {
  removeNode(restartBtn);
  initBoard();
  gameStart();
}

function init() {
  // 이벤트 등록
  window.addEventListener("keydown", onKeyDown);
  startBtn.addEventListener("click", handleClickStartBtn);
  restartBtn.addEventListener("click", handleClickRestartBtn);
}

init();

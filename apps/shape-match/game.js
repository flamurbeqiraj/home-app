const SHAPES = [
  { id: "circle", label: "Rreth", markup: '<circle cx="50" cy="50" r="37" />' },
  { id: "square", label: "Katror", markup: '<rect x="14" y="14" width="72" height="72" rx="8" />' },
  { id: "triangle", label: "Trekëndësh", markup: '<polygon points="50,9 92,88 8,88" />' },
  { id: "rectangle", label: "Drejtkëndësh", markup: '<rect x="7" y="25" width="86" height="50" rx="8" />' },
  { id: "star", label: "Yll", markup: '<polygon points="50,6 61,37 94,38 68,58 77,91 50,72 23,91 32,58 6,38 39,37" />' },
  { id: "heart", label: "Zemër", markup: '<path d="M50 89C43 80 13 62 13 37 13 18 37 12 50 30 63 12 87 18 87 37 87 62 57 80 50 89Z" />' },
  { id: "oval", label: "Oval", markup: '<ellipse cx="50" cy="50" rx="43" ry="29" />' },
  { id: "diamond", label: "Romb", markup: '<polygon points="50,7 92,50 50,93 8,50" />' },
  { id: "pentagon", label: "Pesëkëndësh", markup: '<polygon points="50,7 92,38 76,89 24,89 8,38" />' },
  { id: "hexagon", label: "Gjashtëkëndësh", markup: '<polygon points="25,9 75,9 95,50 75,91 25,91 5,50" />' }
];

const LEVEL_COUNT = 10;
const ROUNDS_PER_LEVEL = 3;
const TOTAL_ROUNDS = LEVEL_COUNT * ROUNDS_PER_LEVEL;
const PASS_PERCENT = 90;
const SHAPE_COLORS = ["#ff5d8f", "#6c63ff", "#ffb703", "#22b883", "#f47721", "#3a86ff"];
const CARD_COLORS = ["#ffe7ef", "#ece8ff", "#fff2c7"];

const elements = {
  startScreen: document.querySelector("#start-screen"),
  playScreen: document.querySelector("#play-screen"),
  endScreen: document.querySelector("#end-screen"),
  startButton: document.querySelector("#start-button"),
  restartButton: document.querySelector("#restart-button"),
  repeatButton: document.querySelector("#repeat-button"),
  levelLabel: document.querySelector("#level-label"),
  roundLabel: document.querySelector("#round-label"),
  score: document.querySelector("#score"),
  timerBar: document.querySelector("#timer-bar"),
  choices: document.querySelector("#choices"),
  feedback: document.querySelector("#feedback"),
  resultPicture: document.querySelector("#result-picture"),
  resultTitle: document.querySelector("#result-title"),
  resultScore: document.querySelector("#result-score"),
  confetti: document.querySelector("#confetti"),
  shapeAudio: document.querySelector("#shape-audio")
};

let level;
let roundInLevel;
let correctAnswers;
let currentShape;
let previousShapeId;
let timerId;
let advanceId;
let roundLocked;
let feedbackContext;

elements.startButton.addEventListener("click", startGame);
elements.restartButton.addEventListener("click", startGame);
elements.repeatButton.addEventListener("click", playShapeAudio);

function startGame() {
  clearTimeout(advanceId);
  clearInterval(timerId);
  stopShapeAudio();
  unlockFeedbackAudio();
  elements.confetti.replaceChildren();
  level = 1;
  roundInLevel = 1;
  correctAnswers = 0;
  previousShapeId = null;
  elements.score.textContent = "0";
  elements.startScreen.classList.add("hidden");
  elements.endScreen.classList.add("hidden");
  elements.playScreen.classList.remove("hidden");
  startRound();
}

function startRound() {
  roundLocked = false;
  elements.levelLabel.textContent = `Niveli ${level}`;
  elements.roundLabel.textContent = `${roundInLevel} / ${ROUNDS_PER_LEVEL}`;
  elements.feedback.className = "feedback";
  elements.feedback.textContent = "Dëgjo me kujdes!";

  const availableShapes = SHAPES.slice(0, Math.min(SHAPES.length, level + 2));
  const targets = availableShapes.filter(shape => shape.id !== previousShapeId);
  currentShape = targets[Math.floor(Math.random() * targets.length)];
  previousShapeId = currentShape.id;

  const distractors = shuffle(availableShapes.filter(shape => shape.id !== currentShape.id)).slice(0, 2);
  const choices = shuffle([currentShape, ...distractors]);
  const colors = shuffle([...SHAPE_COLORS]).slice(0, 3);

  const buttons = choices.map((shape, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.dataset.shape = shape.id;
    button.style.setProperty("--shape-color", colors[index]);
    button.style.setProperty("--card-color", CARD_COLORS[index]);
    button.setAttribute("aria-label", shape.label);
    button.append(createShapeSvg(shape));
    button.addEventListener("click", () => chooseShape(shape, button));
    return button;
  });

  elements.choices.replaceChildren(...buttons);
  playShapeAudio();
  startTimer();
}

function createShapeSvg(shape) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("shape-svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = shape.markup;
  return svg;
}

function playShapeAudio() {
  if (!currentShape || roundLocked) return;
  stopShapeAudio();
  elements.shapeAudio.src = `assets/audio/${currentShape.id}.mp3`;
  elements.shapeAudio.play().catch(error => {
    console.debug("Shape audio could not play", error);
  });
}

function stopShapeAudio() {
  elements.shapeAudio.pause();
  if (elements.shapeAudio.readyState > 0) elements.shapeAudio.currentTime = 0;
}

function chooseShape(shape, selectedButton) {
  if (roundLocked) return;
  finishRound(shape.id === currentShape.id, selectedButton);
}

function finishRound(isCorrect, selectedButton) {
  roundLocked = true;
  clearInterval(timerId);
  stopShapeAudio();
  elements.timerBar.style.transform = "scaleX(0)";

  const buttons = [...elements.choices.querySelectorAll(".choice")];
  const correctButton = buttons.find(button => button.dataset.shape === currentShape.id);
  buttons.forEach(button => {
    button.disabled = true;
    if (button !== correctButton && button !== selectedButton) button.classList.add("dimmed");
  });
  correctButton.classList.add("correct");

  if (isCorrect) {
    correctAnswers += 1;
    elements.score.textContent = correctAnswers;
    elements.feedback.className = "feedback good";
    elements.feedback.textContent = "Shumë mirë! E gjete formën e duhur!";
    playTone(660, 0.36, 880);
  } else {
    selectedButton?.classList.add("wrong");
    elements.feedback.className = "feedback try";
    elements.feedback.textContent = selectedButton
      ? `Provo sërish! Kjo është: ${currentShape.label}.`
      : `Koha mbaroi! Kjo është: ${currentShape.label}.`;
    playTone(280, 0.34, 210);
  }

  advanceId = setTimeout(nextRound, 1400);
}

function nextRound() {
  if (roundInLevel < ROUNDS_PER_LEVEL) {
    roundInLevel += 1;
  } else {
    level += 1;
    roundInLevel = 1;
  }

  if (level > LEVEL_COUNT) showResult();
  else startRound();
}

function startTimer() {
  clearInterval(timerId);
  const seconds = 16 - (level - 1) * 1;
  const duration = seconds * 1000;
  const deadline = performance.now() + duration;
  elements.timerBar.style.transform = "scaleX(1)";

  timerId = setInterval(() => {
    const remaining = Math.max(0, deadline - performance.now());
    elements.timerBar.style.transform = `scaleX(${remaining / duration})`;
    if (remaining === 0) finishRound(false, null);
  }, 40);
}

function showResult() {
  clearInterval(timerId);
  stopShapeAudio();
  elements.playScreen.classList.add("hidden");
  elements.endScreen.classList.remove("hidden");

  const percent = Math.round((correctAnswers / TOTAL_ROUNDS) * 100);
  const passed = percent >= PASS_PERCENT;
  elements.resultPicture.textContent = passed ? "🏆" : "🌈";
  elements.resultTitle.textContent = passed ? "Shkëlqyeshëm!" : "Pothuajse ia dole!";
  elements.resultScore.textContent = `Gjete ${correctAnswers} nga ${TOTAL_ROUNDS} forma (${percent}%).`;
  elements.restartButton.textContent = passed ? "Luaj përsëri" : "Provo përsëri";
  if (passed) createConfetti();
}

function unlockFeedbackAudio() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!feedbackContext || feedbackContext.state === "closed") feedbackContext = new AudioContext();
    if (feedbackContext.state === "suspended") feedbackContext.resume();
    return feedbackContext;
  } catch (error) {
    console.debug("Feedback audio is unavailable", error);
    return null;
  }
}

function playTone(firstFrequency, duration, secondFrequency) {
  try {
    const context = unlockFeedbackAudio();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.type = "sine";
    const start = context.currentTime + 0.015;
    const end = start + duration;
    oscillator.frequency.setValueAtTime(firstFrequency, start);
    oscillator.frequency.linearRampToValueAtTime(secondFrequency, end - 0.04);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.11, start + 0.035);
    gain.gain.setValueAtTime(0.11, end - 0.09);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  } catch (error) {
    console.debug("Feedback tone could not play", error);
  }
}

function createConfetti() {
  const colors = ["#ff5364", "#ffca28", "#43c59e", "#3478e5", "#9b5de5", "#f062aa"];
  const pieces = Array.from({ length: 90 }, (_, index) => {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[index % colors.length];
    piece.style.setProperty("--duration", `${2.4 + Math.random() * 2.2}s`);
    piece.style.setProperty("--delay", `${Math.random() * 1.5}s`);
    piece.style.setProperty("--drift", `${-100 + Math.random() * 200}px`);
    return piece;
  });
  elements.confetti.replaceChildren(...pieces);
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
  return items;
}

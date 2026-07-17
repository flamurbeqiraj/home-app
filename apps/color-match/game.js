const COLORS = [
  { id: "red", name: "e kuqe", value: "#f04455" },
  { id: "blue", name: "e kaltër", value: "#3478e5" },
  { id: "green", name: "e gjelbër", value: "#2caf72" },
  { id: "yellow", name: "e verdhë", value: "#f5c518" },
  { id: "orange", name: "portokalli", value: "#f58b24" },
  { id: "purple", name: "vjollcë", value: "#8a56d6" },
  { id: "pink", name: "rozë", value: "#f062aa" },
  { id: "brown", name: "kafe", value: "#8b5e3c" }
];

const SHAPES = ["square", "circle", "triangle"];
const LEVEL_COUNT = 10;
const ROUNDS_PER_LEVEL = 3;
const TOTAL_ROUNDS = LEVEL_COUNT * ROUNDS_PER_LEVEL;
const PASS_PERCENT = 90;
const COLOR_AUDIO = new Map(COLORS.map(color => {
  const audio = new Audio(`audio/${color.id}.mp3`);
  audio.preload = "auto";
  return [color.id, audio];
}));

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
  confetti: document.querySelector("#confetti")
};

let level;
let roundInLevel;
let correctAnswers;
let currentColor;
let timerId;
let advanceId;
let roundLocked;
let playingColorAudio;

elements.startButton.addEventListener("click", startGame);
elements.restartButton.addEventListener("click", startGame);
elements.repeatButton.addEventListener("click", () => playColorAudio(currentColor));

function startGame() {
  clearTimeout(advanceId);
  clearInterval(timerId);
  stopColorAudio();
  elements.confetti.replaceChildren();
  level = 1;
  roundInLevel = 1;
  correctAnswers = 0;
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

  const options = sample(COLORS, 3);
  currentColor = options[Math.floor(Math.random() * options.length)];
  const shuffledShapes = shuffle([...SHAPES]);

  const buttons = options.map((color, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `choice ${shuffledShapes[index]}`;
    button.style.setProperty("--choice-color", color.value);
    button.dataset.color = color.id;
    button.setAttribute("aria-label", color.name);
    button.addEventListener("click", () => chooseColor(color, button));
    return button;
  });

  elements.choices.replaceChildren(...buttons);
  playColorAudio(currentColor);
  startTimer();
}

function chooseColor(color, selectedButton) {
  if (roundLocked) return;
  finishRound(color.id === currentColor.id, selectedButton);
}

function finishRound(isCorrect, selectedButton) {
  roundLocked = true;
  clearInterval(timerId);
  elements.timerBar.style.transform = "scaleX(0)";

  const buttons = [...elements.choices.querySelectorAll(".choice")];
  const correctButton = buttons.find(button => button.dataset.color === currentColor.id);
  buttons.forEach(button => {
    button.disabled = true;
    if (button !== correctButton && button !== selectedButton) button.classList.add("dimmed");
  });
  correctButton.classList.add("correct");

  if (isCorrect) {
    correctAnswers += 1;
    elements.score.textContent = correctAnswers;
    elements.feedback.className = "feedback good";
    elements.feedback.textContent = "Shumë mirë! E gjete ngjyrën e duhur!";
    playTone(660, 0.12, 880);
  } else {
    selectedButton?.classList.add("wrong");
    elements.feedback.className = "feedback try";
    elements.feedback.textContent = selectedButton
      ? `Provo sërish! Ngjyra e duhur ishte: ${currentColor.name}.`
      : `Koha mbaroi! Ngjyra e duhur ishte: ${currentColor.name}.`;
    playTone(260, 0.16, 220);
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

  if (level > LEVEL_COUNT) {
    showResult();
  } else {
    startRound();
  }
}

function startTimer() {
  clearInterval(timerId);
  const seconds = 8 - (level - 1) * 0.5;
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
  stopColorAudio();
  elements.playScreen.classList.add("hidden");
  elements.endScreen.classList.remove("hidden");

  const percent = Math.round((correctAnswers / TOTAL_ROUNDS) * 100);
  const passed = percent >= PASS_PERCENT;
  elements.resultPicture.textContent = passed ? "🍭" : "🌈";
  elements.resultTitle.textContent = passed ? "Shkëlqyeshëm!" : "Pothuajse ia dole!";
  elements.resultScore.textContent = `Gjete ${correctAnswers} nga ${TOTAL_ROUNDS} ngjyra (${percent}%).`;
  elements.restartButton.textContent = passed ? "Luaj përsëri" : "Provo përsëri";

  if (passed) createConfetti();
}

function playColorAudio(color) {
  if (!color) return;
  stopColorAudio();
  playingColorAudio = COLOR_AUDIO.get(color.id);
  playingColorAudio.currentTime = 0;
  playingColorAudio.play().catch(error => {
    console.debug("Regjistrimi zanor nuk mund të luhej", error);
  });
}

function stopColorAudio() {
  if (!playingColorAudio) return;
  playingColorAudio.pause();
  playingColorAudio.currentTime = 0;
  playingColorAudio = null;
}

function playTone(firstFrequency, duration, secondFrequency) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.frequency.setValueAtTime(firstFrequency, context.currentTime);
    oscillator.frequency.linearRampToValueAtTime(secondFrequency, context.currentTime + duration);
    gain.gain.setValueAtTime(0.12, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
    oscillator.addEventListener("ended", () => context.close());
  } catch (error) {
    console.debug("Sound effect unavailable", error);
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

function sample(items, amount) {
  return shuffle([...items]).slice(0, amount);
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
  return items;
}

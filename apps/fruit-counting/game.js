const LEVEL_COUNT = 10;
const ROUNDS_PER_LEVEL = 3;
const TOTAL_ROUNDS = LEVEL_COUNT * ROUNDS_PER_LEVEL;
const PASS_PERCENT = 90;
const CHOICE_BACKGROUNDS = ["#fff2c7", "#e6f8dc", "#e2f3ff"];

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
  promptAudio: document.querySelector("#prompt-audio")
};

let manifest;
let level;
let roundInLevel;
let correctAnswers;
let currentFood;
let currentNumber;
let previousFoodId;
let timerId;
let advanceId;
let audioGapId;
let promptToken = 0;
let roundLocked;
let feedbackContext;

elements.startButton.addEventListener("click", startGame);
elements.restartButton.addEventListener("click", startGame);
elements.repeatButton.addEventListener("click", playPrompt);

loadManifest();

async function loadManifest() {
  try {
    const response = await fetch("assets/manifest.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Manifest request failed (${response.status})`);
    manifest = await response.json();
    elements.startButton.disabled = false;
    elements.startButton.textContent = "Luaj!";
  } catch (error) {
    console.error(error);
    elements.startButton.textContent = "Loja nuk u ngarkua";
  }
}

function startGame() {
  clearTimeout(advanceId);
  clearInterval(timerId);
  stopPromptAudio();
  unlockFeedbackAudio();
  elements.confetti.replaceChildren();
  level = 1;
  roundInLevel = 1;
  correctAnswers = 0;
  previousFoodId = null;
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
  elements.timerBar.style.transform = "scaleX(1)";

  const availableFoods = manifest.foods.filter(food => food.id !== previousFoodId);
  currentFood = availableFoods[Math.floor(Math.random() * availableFoods.length)];
  previousFoodId = currentFood.id;

  const maximumNumber = Math.min(10, level + 2);
  currentNumber = 1 + Math.floor(Math.random() * maximumNumber);
  const choiceNumbers = createChoiceNumbers(currentNumber, maximumNumber);

  const buttons = choiceNumbers.map((number, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.dataset.number = number;
    button.style.setProperty("--choice-background", CHOICE_BACKGROUNDS[index]);
    button.setAttribute("aria-label", `${number} ${currentFood.label}`);

    const image = document.createElement("img");
    image.src = assetPath(currentFood.countImages.replace("{count}", number));
    image.alt = "";
    image.draggable = false;

    button.append(image);
    button.addEventListener("click", () => chooseNumber(number, button));
    return button;
  });

  elements.choices.replaceChildren(...buttons);
  playPrompt();
}

function createChoiceNumbers(answer, maximum) {
  const pool = Array.from({ length: maximum }, (_, index) => index + 1)
    .sort((left, right) => Math.abs(left - answer) - Math.abs(right - answer));
  const choices = [answer];

  for (const number of pool) {
    if (number !== answer && !choices.includes(number)) choices.push(number);
    if (choices.length === 3) break;
  }

  return shuffle(choices);
}

function playPrompt() {
  if (!currentFood || !currentNumber || roundLocked) return;
  clearInterval(timerId);
  stopPromptAudio();
  elements.timerBar.style.transform = "scaleX(1)";
  const token = ++promptToken;
  const numberAudio = manifest.numbers.find(item => item.value === currentNumber).audio;

  playAudioFile(assetPath(numberAudio), token, () => {
    audioGapId = setTimeout(() => {
      if (token !== promptToken) return;
      playAudioFile(assetPath(currentFood.audio), token, () => {
        if (token === promptToken && !roundLocked) startTimer();
      });
    }, 140);
  });
}

function playAudioFile(source, token, onFinished) {
  elements.promptAudio.onended = null;
  elements.promptAudio.src = source;
  elements.promptAudio.onended = () => {
    if (token === promptToken) onFinished();
  };
  elements.promptAudio.play().catch(error => {
    console.debug("Prompt audio could not play", error);
    if (token === promptToken) onFinished();
  });
}

function stopPromptAudio() {
  clearTimeout(audioGapId);
  promptToken += 1;
  elements.promptAudio.onended = null;
  elements.promptAudio.pause();
  if (elements.promptAudio.readyState > 0) elements.promptAudio.currentTime = 0;
}

function chooseNumber(number, selectedButton) {
  if (roundLocked) return;
  finishRound(number === currentNumber, selectedButton);
}

function finishRound(isCorrect, selectedButton) {
  roundLocked = true;
  clearInterval(timerId);
  stopPromptAudio();
  elements.timerBar.style.transform = "scaleX(0)";

  const buttons = [...elements.choices.querySelectorAll(".choice")];
  const correctButton = buttons.find(button => Number(button.dataset.number) === currentNumber);
  buttons.forEach(button => {
    button.disabled = true;
    if (button !== correctButton && button !== selectedButton) button.classList.add("dimmed");
  });
  correctButton.classList.add("correct");

  if (isCorrect) {
    correctAnswers += 1;
    elements.score.textContent = correctAnswers;
    elements.feedback.className = "feedback good";
    elements.feedback.textContent = "Shumë mirë! E gjete numrin e duhur!";
    playTone(660, 0.36, 880);
  } else {
    selectedButton?.classList.add("wrong");
    elements.feedback.className = "feedback try";
    elements.feedback.textContent = selectedButton
      ? `Provo sërish! Përgjigjja ishte ${currentNumber}.`
      : `Koha mbaroi! Përgjigjja ishte ${currentNumber}.`;
    playTone(280, 0.34, 210);
  }

  advanceId = setTimeout(nextRound, 1500);
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
  const seconds = 20 - (level - 1) * 1.2;
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
  stopPromptAudio();
  elements.playScreen.classList.add("hidden");
  elements.endScreen.classList.remove("hidden");

  const percent = Math.round((correctAnswers / TOTAL_ROUNDS) * 100);
  const passed = percent >= PASS_PERCENT;
  elements.resultPicture.textContent = passed ? "🧺" : "🌱";
  elements.resultTitle.textContent = passed ? "Shkëlqyeshëm!" : "Pothuajse ia dole!";
  elements.resultScore.textContent = `Gjete ${correctAnswers} nga ${TOTAL_ROUNDS} përgjigje (${percent}%).`;
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

function assetPath(relativePath) {
  return `assets/${relativePath}`;
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
  return items;
}

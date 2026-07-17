const DIRECTIONS = [
  { id: "left", label: "Majtas", destination: "🌳" },
  { id: "right", label: "Djathtas", destination: "🏠" },
  { id: "forward", label: "Përpara", destination: "🏫" },
  { id: "backward", label: "Prapa", destination: "🏖️" }
];
const LEVEL_COUNT = 6;
const ROUNDS_PER_LEVEL = 3;
const TOTAL_ROUNDS = LEVEL_COUNT * ROUNDS_PER_LEVEL;
const PASS_PERCENT = 80;
const elements = {
  startScreen: document.querySelector("#start-screen"), playScreen: document.querySelector("#play-screen"),
  endScreen: document.querySelector("#end-screen"), startButton: document.querySelector("#start-button"),
  restartButton: document.querySelector("#restart-button"), repeatButton: document.querySelector("#repeat-button"),
  levelLabel: document.querySelector("#level-label"), roundLabel: document.querySelector("#round-label"),
  score: document.querySelector("#score"), timerBar: document.querySelector("#timer-bar"),
  feedback: document.querySelector("#feedback"), car: document.querySelector("#car"),
  destination: document.querySelector("#destination"), controls: document.querySelector("#controls"),
  resultPicture: document.querySelector("#result-picture"), resultTitle: document.querySelector("#result-title"),
  resultScore: document.querySelector("#result-score"), confetti: document.querySelector("#confetti"),
  directionAudio: document.querySelector("#direction-audio")
};
let level, roundInLevel, correctAnswers, currentDirection, previousDirectionId;
let timerId, advanceId, roundLocked, feedbackContext;

elements.startButton.addEventListener("click", startGame);
elements.restartButton.addEventListener("click", startGame);
elements.repeatButton.addEventListener("click", playDirectionAudio);
elements.controls.addEventListener("click", event => {
  const button = event.target.closest(".direction");
  if (button) chooseDirection(button.dataset.direction, button);
});

function startGame() {
  clearTimeout(advanceId);
  clearInterval(timerId);
  stopDirectionAudio();
  unlockFeedbackAudio();
  level = 1;
  roundInLevel = 1;
  correctAnswers = 0;
  previousDirectionId = null;
  elements.score.textContent = "0";
  elements.confetti.replaceChildren();
  elements.startScreen.classList.add("hidden");
  elements.endScreen.classList.add("hidden");
  elements.playScreen.classList.remove("hidden");
  startRound();
}

function startRound() {
  roundLocked = false;
  elements.levelLabel.textContent = "Niveli " + level;
  elements.roundLabel.textContent = roundInLevel + " / " + ROUNDS_PER_LEVEL;
  elements.feedback.className = "feedback";
  elements.feedback.textContent = "Dëgjo me kujdes!";
  elements.car.className = "car";
  const available = DIRECTIONS.filter(direction => direction.id !== previousDirectionId);
  currentDirection = available[Math.floor(Math.random() * available.length)];
  previousDirectionId = currentDirection.id;
  elements.destination.textContent = currentDirection.destination;
  elements.destination.className = "destination at-" + currentDirection.id;
  [...elements.controls.querySelectorAll(".direction")].forEach(button => {
    button.disabled = false;
    button.classList.remove("correct", "wrong", "dimmed");
  });
  playDirectionAudio();
  startTimer();
}

function playDirectionAudio() {
  if (!currentDirection || roundLocked) return;
  stopDirectionAudio();
  elements.directionAudio.src = "assets/audio/" + currentDirection.id + ".mp3";
  elements.directionAudio.play().catch(error => console.debug("Direction audio could not play", error));
}

function stopDirectionAudio() {
  elements.directionAudio.pause();
  if (elements.directionAudio.readyState > 0) elements.directionAudio.currentTime = 0;
}

function chooseDirection(directionId, selectedButton) {
  if (!roundLocked) finishRound(directionId === currentDirection.id, selectedButton);
}

function finishRound(isCorrect, selectedButton) {
  roundLocked = true;
  clearInterval(timerId);
  stopDirectionAudio();
  elements.timerBar.style.transform = "scaleX(0)";
  const buttons = [...elements.controls.querySelectorAll(".direction")];
  const correctButton = buttons.find(button => button.dataset.direction === currentDirection.id);
  buttons.forEach(button => {
    button.disabled = true;
    if (button !== selectedButton && button !== correctButton) button.classList.add("dimmed");
  });
  correctButton.classList.add("correct");
  elements.car.classList.add("drive-" + currentDirection.id);
  if (isCorrect) {
    correctAnswers += 1;
    elements.score.textContent = correctAnswers;
    elements.feedback.className = "feedback good";
    elements.feedback.textContent = "Bravo! " + currentDirection.label + "!";
    playTone(660, 0.36, 880);
  } else {
    if (selectedButton) selectedButton.classList.add("wrong");
    elements.feedback.className = "feedback try";
    elements.feedback.textContent = selectedButton
      ? "Kjo është " + currentDirection.label + ". Shiko shigjetën!"
      : "Koha mbaroi! Kjo është " + currentDirection.label + ".";
    playTone(280, 0.34, 210);
  }
  advanceId = setTimeout(nextRound, 1650);
}

function nextRound() {
  if (roundInLevel < ROUNDS_PER_LEVEL) roundInLevel += 1;
  else { level += 1; roundInLevel = 1; }
  if (level > LEVEL_COUNT) showResult();
  else startRound();
}

function startTimer() {
  clearInterval(timerId);
  const seconds = Math.max(8, 15 - level);
  const duration = seconds * 1000;
  const deadline = performance.now() + duration;
  elements.timerBar.style.transform = "scaleX(1)";
  timerId = setInterval(() => {
    const remaining = Math.max(0, deadline - performance.now());
    elements.timerBar.style.transform = "scaleX(" + remaining / duration + ")";
    if (remaining === 0) finishRound(false, null);
  }, 40);
}

function showResult() {
  clearInterval(timerId);
  stopDirectionAudio();
  elements.playScreen.classList.add("hidden");
  elements.endScreen.classList.remove("hidden");
  const percent = Math.round(correctAnswers / TOTAL_ROUNDS * 100);
  const passed = percent >= PASS_PERCENT;
  elements.resultPicture.textContent = passed ? "🏆" : "🚙";
  elements.resultTitle.textContent = passed ? "Shofer i shkëlqyer!" : "Edhe një xhiro!";
  elements.resultScore.textContent = "Gjete " + correctAnswers + " nga " + TOTAL_ROUNDS + " drejtime (" + percent + "%).";
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
  const colors = ["#ff5364", "#ffca28", "#43c59e", "#3478e5", "#9b5de5"];
  const pieces = Array.from({ length: 80 }, (_, index) => {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.backgroundColor = colors[index % colors.length];
    piece.style.setProperty("--duration", 2.4 + Math.random() * 2 + "s");
    piece.style.setProperty("--delay", Math.random() * 1.2 + "s");
    piece.style.setProperty("--drift", -100 + Math.random() * 200 + "px");
    return piece;
  });
  elements.confetti.replaceChildren(...pieces);
}

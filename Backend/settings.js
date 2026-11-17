import { refreshScramble, updateScrambleVisibility } from "./timer.js";
import { showSection } from "./storage.js";

// --- DOM Elements ---
const backBtn = document.getElementById("backBtn");
const showTimeSwitch = document.getElementById("showTimeDuringSolveSwitch");
const showScrambleSwitch = document.getElementById("showScramble");
const scrambleSlider = document.querySelector("#scrambleLength input[type='range']");
const sliderValueSpan = document.querySelector("#scrambleLength .slider-side");

// --- Init ---
showTimeSwitch.checked = localStorage.getItem("showTimeWhileSolving") === "true";
showScrambleSwitch.checked = localStorage.getItem("showScramble") === "true";

const savedScrambleLength = localStorage.getItem("scrambleLength") || "20";
scrambleSlider.value = savedScrambleLength;
sliderValueSpan.textContent = savedScrambleLength;

// --- Event Listeners ---
showTimeSwitch.addEventListener("change", (e) => {
    localStorage.setItem("showTimeWhileSolving", e.target.checked);
});

showScrambleSwitch.addEventListener("change", (e) => {
    localStorage.setItem("showScramble", e.target.checked);
});

scrambleSlider.addEventListener("input", (e) => {
    const val = e.target.value;
    sliderValueSpan.textContent = val;
    localStorage.setItem("scrambleLength", val);
});

backBtn.addEventListener("click", () => {
    showSection("timer");
    updateScrambleVisibility();
    refreshScramble();
});
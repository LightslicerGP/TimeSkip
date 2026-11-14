import { updateScrambleVisibility, refreshScramble } from "./timer.js";

const backBtn = document.getElementById("backBtn");
const settingsSection = document.getElementById("settings");
const timerBackgroundElement = document.getElementById("timer");
const showTimeSwitch = document.getElementById("showTimeDuringSolveSwitch");
const showScrambleSwitch = document.getElementById("showScramble");

const scrambleSlider = document.querySelector("#scrambleLength input[type='range']");
const sliderValueSpan = document.querySelector("#scrambleLength .slider-side");

showTimeSwitch.checked = localStorage.getItem("showTimeWhileSolving") === "true";
showScrambleSwitch.checked = localStorage.getItem("showScramble") === "true";

const savedScrambleLength = localStorage.getItem("scrambleLength") || "20";
scrambleSlider.value = savedScrambleLength;
sliderValueSpan.textContent = savedScrambleLength;

showTimeSwitch.addEventListener("change", (event) => {
    localStorage.setItem("showTimeWhileSolving", event.target.checked);
});

showScrambleSwitch.addEventListener("change", (event) => {
    localStorage.setItem("showScramble", event.target.checked);
});

scrambleSlider.addEventListener("input", (event) => {
    const val = event.target.value;
    sliderValueSpan.textContent = val;
    localStorage.setItem("scrambleLength", val);
});

backBtn.addEventListener("click", () => {
    timerBackgroundElement.classList.remove("removed");
    settingsSection.classList.add("removed");
    updateScrambleVisibility();
    refreshScramble();
});
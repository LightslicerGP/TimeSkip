import { updateScrambleVisibility } from "./timer.js";

const backBtn = document.getElementById("backBtn");
const settingsSection = document.getElementById("settings");
const timerBackgroundElement = document.getElementById("timer");
const showTimeSwitch = document.getElementById("showTimeDuringSolveSwitch");
const showScrambleSwitch = document.getElementById("showScramble");

showTimeSwitch.checked = localStorage.getItem("showTimeWhileSolving") === "true";
showScrambleSwitch.checked = localStorage.getItem("showScramble") === "true";

showTimeSwitch.addEventListener("change", (event) => {
    localStorage.setItem("showTimeWhileSolving", event.target.checked);
});

showScrambleSwitch.addEventListener("change", (event) => {
    localStorage.setItem("showScramble", event.target.checked);
});

backBtn.addEventListener("click", () => {
    timerBackgroundElement.classList.remove("removed");
    settingsSection.classList.add("removed");
    updateScrambleVisibility();
});
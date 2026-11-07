const backBtn = document.getElementById("backBtn");
const settingsSection = document.getElementById("settings");
const timerBackgroundElement = document.getElementById("timer");
const showTimeSwitch = document.getElementById("showTimeDuringSolveSwitch");

showTimeSwitch.checked = localStorage.getItem("showTimeWhileSolving") === "true";

showTimeSwitch.addEventListener("change", (event) => {
    localStorage.setItem("showTimeWhileSolving", event.target.checked);
});

backBtn.addEventListener("click", () => {
    timerBackgroundElement.classList.remove("removed");
    settingsSection.classList.add("removed");
});
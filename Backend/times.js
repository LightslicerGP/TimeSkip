const timesBackBtn = document.getElementById("timesBackBtn");
const timesSection = document.getElementById("times");
const timerBackgroundElement = document.getElementById("timer");

timesBackBtn.addEventListener("click", () => {
    timerBackgroundElement.classList.remove("removed");
    timesSection.classList.add("removed");
});
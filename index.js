class Time {
    constructor(ms = 0, seconds = 0, minutes = 0, category = "") {
        this.ms = Number(ms) || 0;
        this.seconds = Number(seconds) || 0;
        this.minutes = Number(minutes) || 0;
        this.category = String(category ?? "");
        this.datetime = new Date().toISOString();
    }

    get totalMs() {
        return this.minutes * 60_000 + this.seconds * 1000 + this.ms;
    }

    toString() {
        const total = Math.max(0, Math.floor(this.totalMs));
        const minutes = Math.floor(total / 60_000);
        const seconds = Math.floor((total % 60_000) / 1000);
        const ms = total % 1000;
        const paddedMs = String(ms).padStart(3, "0");
        const paddedSeconds = String(seconds).padStart(2, "0");

        if (minutes > 0) {
            return `${minutes}:${paddedSeconds}.${paddedMs}`;
        }

        return `${seconds}.${paddedMs}`;
    }
}

readyColor = "#0080ff";
inspectionColor = "#ff4040";
timingColor = "#00ff80";
readyTimeMS = 250;

timerBackgroundElement = document.getElementById("timer");
timerTextElement = document.getElementById("time");

function init() {
    timerBackgroundElement.style.backgroundColor = readyColor;
}

init();

function startInspection() {
    timerBackgroundElement.style.backgroundColor = inspectionColor;
}

document.addEventListener("touchstart", () => {
    startInspection();
});

document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        event.preventDefault();
    }
});

document.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
        startInspection();
    }
});

function startTiming() {
    timerBackgroundElement.style.backgroundColor = timingColor;
}
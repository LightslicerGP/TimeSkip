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

const STAGES = {
    READY: { normal: "#0080ff", bright: "#40a0ff" },
    INSPECTION: { normal: "#ff4040", bright: "#ff7070" },
    TIMING: { normal: "#00ff80", bright: "#40ffa0" }
};

const STAGE_ORDER = ["READY", "INSPECTION", "TIMING"];
let currentStageIndex = 0;
let isPressed = false;

const timerBackgroundElement = document.getElementById("timer");
const timerTextElement = document.getElementById("time");

function applyCurrentBackgroundColor() {
    const stageKey = STAGE_ORDER[currentStageIndex];
    const stage = STAGES[stageKey];
    timerBackgroundElement.style.backgroundColor = isPressed ? stage.bright : stage.normal;
}

function advanceStage() {
    currentStageIndex = (currentStageIndex + 1) % STAGE_ORDER.length;
}

function handlePressDown() {
    const stageKey = STAGE_ORDER[currentStageIndex];

    if (stageKey === "TIMING") {
        currentStageIndex = 0;
        isPressed = false;
        applyCurrentBackgroundColor();
        return;
    }

    if (isPressed) return;
    isPressed = true;
    applyCurrentBackgroundColor();
}

function handlePressUp() {
    if (!isPressed) return;
    isPressed = false;
    advanceStage();
    applyCurrentBackgroundColor();
}

document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        event.preventDefault();
        if (!event.repeat) {
            handlePressDown();
        }
    }
});

document.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
        event.preventDefault();
        handlePressUp();
    }
});

document.addEventListener("touchstart", (event) => {
    handlePressDown();
}, { passive: true });

document.addEventListener("touchend", (event) => {
    handlePressUp();
}, { passive: true });

document.addEventListener("touchcancel", (event) => {
    handlePressUp();
}, { passive: true });

applyCurrentBackgroundColor();
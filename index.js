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
        const divisor = Math.pow(10, 3 - decimalPlaces);
        const subMs = Math.floor((total % 1000) / divisor);
        const paddedSubMs = String(subMs).padStart(decimalPlaces, "0");
        const paddedSeconds = String(seconds).padStart(2, "0");

        if (minutes > 0) {
            return `${minutes}:${paddedSeconds}.${paddedSubMs}`;
        }

        return `${seconds}.${paddedSubMs}`;
    }
}

const STAGES = {
    READY: { normal: "#0080ff", bright: "#40a0ff" },
    INSPECTION: { normal: "#ff4040", bright: "#ff7070" },
    TIMING: { normal: "#00ff80", bright: "#40ffa0" }
};

const STAGE_ORDER = ["READY", "INSPECTION", "TIMING"];
const decimalPlaces = 3;
const holdDelay = 500;

let currentStageIndex = 0;
let isPressed = false;

let inspectionInterval = null;
let inspectionTimeLeft = 15;
let timingInterval = null;
let timingStartTime = 0;

let inspectionHoldTimeout = null;
let inspectionReadyToStart = false;

const timerBackgroundElement = document.getElementById("timer");
const timerTextElement = document.getElementById("time");
const fullscreenBtn = document.getElementById("fullscreenBtn");

if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });
}

function clearAllTimers() {
    if (inspectionInterval) {
        clearInterval(inspectionInterval);
        inspectionInterval = null;
    }
    if (timingInterval) {
        cancelAnimationFrame(timingInterval);
        timingInterval = null;
    }
    if (inspectionHoldTimeout) {
        clearTimeout(inspectionHoldTimeout);
        inspectionHoldTimeout = null;
    }
}

function applyCurrentBackgroundColor() {
    const stageKey = STAGE_ORDER[currentStageIndex];
    const stage = STAGES[stageKey];
    timerBackgroundElement.style.backgroundColor = isPressed ? stage.bright : stage.normal;
}

function updateStageUI() {
    const stageKey = STAGE_ORDER[currentStageIndex];
    applyCurrentBackgroundColor();

    if (stageKey === "READY" && timerTextElement.textContent === "12.34") {
        timerTextElement.textContent = "Ready";
    } else if (stageKey === "INSPECTION") {
        timerTextElement.textContent = inspectionTimeLeft;
    }
}

function formatTime(elapsedMs) {
    const total = Math.max(0, Math.floor(elapsedMs));
    const minutes = Math.floor(total / 60_000);
    const seconds = Math.floor((total % 60_000) / 1000);
    const divisor = Math.pow(10, 3 - decimalPlaces);
    const subMs = Math.floor((total % 1000) / divisor);

    const paddedSubMs = String(subMs).padStart(decimalPlaces, "0");
    const paddedSeconds = String(seconds).padStart(2, "0");

    if (minutes > 0) {
        return `${minutes}:${paddedSeconds}.${paddedSubMs}`;
    }

    return `${seconds}.${paddedSubMs}`;
}

function advanceStage() {
    clearAllTimers();
    currentStageIndex = (currentStageIndex + 1) % STAGE_ORDER.length;
    const stageKey = STAGE_ORDER[currentStageIndex];

    if (stageKey === "INSPECTION") {
        inspectionTimeLeft = 15;
        inspectionReadyToStart = false;
        updateStageUI();
        inspectionInterval = setInterval(() => {
            if (inspectionTimeLeft > 0) {
                inspectionTimeLeft--;
                timerTextElement.textContent = inspectionTimeLeft;
            }
            if (inspectionTimeLeft <= 0) {
                clearInterval(inspectionInterval);
                inspectionInterval = null;
            }
        }, 1000);
    } else if (stageKey === "TIMING") {
        updateStageUI();
        timingStartTime = performance.now();

        const updateTimer = () => {
            const elapsedMs = performance.now() - timingStartTime;
            timerTextElement.textContent = formatTime(elapsedMs);
            timingInterval = requestAnimationFrame(updateTimer);
        };
        timingInterval = requestAnimationFrame(updateTimer);
    } else {
        updateStageUI();
    }
}

function handlePressDown() {
    const stageKey = STAGE_ORDER[currentStageIndex];

    if (stageKey === "TIMING") {
        if (timingInterval) {
            cancelAnimationFrame(timingInterval);
            timingInterval = null;
        }
        currentStageIndex = 0;
        isPressed = false;
        applyCurrentBackgroundColor();
        return;
    }

    if (isPressed) return;
    isPressed = true;

    if (stageKey === "INSPECTION") {
        inspectionReadyToStart = false;
        applyCurrentBackgroundColor();
        inspectionHoldTimeout = setTimeout(() => {
            inspectionReadyToStart = true;
            timerBackgroundElement.style.backgroundColor = STAGES.TIMING.bright;
        }, holdDelay);
    } else {
        applyCurrentBackgroundColor();
    }
}

function handlePressUp() {
    const stageKey = STAGE_ORDER[currentStageIndex];

    if (!isPressed && stageKey !== "TIMING") return;

    if (stageKey === "INSPECTION") {
        if (inspectionHoldTimeout) {
            clearTimeout(inspectionHoldTimeout);
            inspectionHoldTimeout = null;
        }

        if (inspectionReadyToStart) {
            isPressed = false;
            advanceStage();
        } else {
            isPressed = false;
            applyCurrentBackgroundColor();
        }
        return;
    }

    isPressed = false;
    advanceStage();
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
    if (event.target.closest("nav")) return;
    handlePressDown();
}, { passive: true });

document.addEventListener("touchend", (event) => {
    if (event.target.closest("nav") && !isPressed) return;
    handlePressUp();
}, { passive: true });

document.addEventListener("touchcancel", (event) => {
    handlePressUp();
}, { passive: true });

updateStageUI();
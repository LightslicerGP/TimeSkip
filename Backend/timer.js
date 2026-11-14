class Time {
    constructor(ms = 0, seconds = 0, minutes = 0, category = "") {
        this.ms = Number(ms) || 0;
        this.seconds = Number(seconds) || 0;
        this.minutes = Number(minutes) || 0;
        this.category = String(category ?? "3x3");
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
const showTimeWhileSolving = () => localStorage.getItem("showTimeWhileSolving") === "true";
const showScramblePref = () => localStorage.getItem("showScramble") === "true";

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
const scrambleElement = document.getElementById("scramble");
const navElement = document.querySelector("#timer nav");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsSection = document.getElementById("settings");

fullscreenBtn.addEventListener("click", () => {
    if (document.documentElement.requestFullscreen) {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    } else {
        console.warn("Fullscreen API is not supported on this iOS browser. Use 'Add to Home Screen' to run as a full-screen PWA.");
    }
});

settingsBtn.addEventListener("click", () => {
    settingsSection.classList.remove("removed");
    timerBackgroundElement.classList.add("removed");
});

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

function updateNavVisibility() {
    const stageKey = STAGE_ORDER[currentStageIndex];
    if (stageKey === "INSPECTION" || stageKey === "TIMING") {
        navElement.classList.add("removed");
    } else {
        navElement.classList.remove("removed");
    }
}

export function updateScrambleVisibility() {
    if (!scrambleElement) return;
    const stageKey = STAGE_ORDER[currentStageIndex];

    if (stageKey === "READY" && showScramblePref()) {
        scrambleElement.classList.remove("removed");
    } else {
        scrambleElement.classList.add("removed");
    }
}

function generateScramble(length = 20) {
    const sides = ["U", "R", "F", "D", "L", "B"];
    const moves = ["", "2", "'"];
    const opposites = {
        "U": "D", "D": "U",
        "R": "L", "L": "R",
        "F": "B", "B": "F"
    };
    const scramble = [];
    let lastSide = null;

    for (let i = 0; i < length; i++) {
        const availableSides = sides.filter(side =>
            side !== lastSide && side !== opposites[lastSide]
        );

        const side = availableSides[Math.floor(Math.random() * availableSides.length)];
        const move = moves[Math.floor(Math.random() * moves.length)];

        scramble.push(side + move);
        lastSide = side;


    }
    return scramble.join(" ");
}

export function refreshScramble() {
    if (!scrambleElement) return;
    const customLength = parseInt(localStorage.getItem("scrambleLength"), 10) || 20;
    scrambleElement.textContent = generateScramble(customLength);
}

function updateStageUI() {
    const stageKey = STAGE_ORDER[currentStageIndex];
    applyCurrentBackgroundColor();
    updateNavVisibility();
    updateScrambleVisibility();

    if (stageKey === "READY") {
        const customLength = parseInt(localStorage.getItem("scrambleLength"), 10) || 20;
        scrambleElement.textContent = generateScramble(customLength);
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

        if (!showTimeWhileSolving()) {
            timerTextElement.textContent = "Solving...";
        }

        const updateTimer = () => {
            const elapsedMs = performance.now() - timingStartTime;
            if (showTimeWhileSolving()) {
                timerTextElement.textContent = formatTime(elapsedMs);
            }
            timingInterval = requestAnimationFrame(updateTimer);
        };
        timingInterval = requestAnimationFrame(updateTimer);
    } else {
        updateStageUI();
    }
}

function handlePressDown() {
    if (timerBackgroundElement.classList.contains("removed")) return;

    const stageKey = STAGE_ORDER[currentStageIndex];

    if (stageKey === "TIMING") {
        const elapsedMs = performance.now() - timingStartTime;
        if (timingInterval) {
            cancelAnimationFrame(timingInterval);
            timingInterval = null;
        }
        timerTextElement.textContent = formatTime(elapsedMs);

        const minutes = Math.floor(elapsedMs / 60_000);
        const seconds = Math.floor((elapsedMs % 60_000) / 1000);
        const ms = Math.floor(elapsedMs % 1000);
        const newTime = new Time(ms, seconds, minutes);

        const savedTimes = JSON.parse(localStorage.getItem("solveTimes") || "[]");
        savedTimes.push(newTime);
        localStorage.setItem("solveTimes", JSON.stringify(savedTimes));

        currentStageIndex = 0;
        isPressed = false;
        updateStageUI();
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
    if (timerBackgroundElement.classList.contains("removed")) return;

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
import { formatMs, getSolveTotalMs } from "./formatters.js";
import { getSavedTimes, getStatsConfig, saveTimes, showSection } from "./storage.js";
import { computeStatValue, STATS_BY_ID } from "./statsRegistry.js";

// --- Constants ---
const HOLD_DELAY = 500;
const STAGE_ORDER = ["READY", "INSPECTION", "TIMING"];
const STAGES = {
    READY: { normal: "#0080ff", bright: "#40a0ff" },
    INSPECTION: { normal: "#ff4040", bright: "#ff7070" },
    TIMING: { normal: "#00ff80", bright: "#40ffa0" }
};
const SCRAMBLE_SIDES = ["U", "R", "F", "D", "L", "B"];
const SCRAMBLE_MOVES = ["", "2", "'"];
const SCRAMBLE_OPPOSITES = { U: "D", D: "U", R: "L", L: "R", F: "B", B: "F" };
const SESSION_START_KEY = "timeskipSessionStart";

// --- DOM Elements ---
const timerSection = document.getElementById("timer");
const timerTextEl = document.getElementById("time");
const scrambleEl = document.getElementById("scramble");
const statsBLEl = document.getElementById("statsBL");
const statsBREl = document.getElementById("statsBR");
const navEl = document.querySelector("#timer nav");
const trEl = document.getElementById("TR");
const zenModeBtn = document.getElementById("zenMode");
const zenParentEl = zenModeBtn?.parentElement || null;
const originalZenParentOpacity = zenParentEl ? zenParentEl.style.opacity : "";
const fullscreenBtn = document.getElementById("fullscreenBtn");
const settingsBtn = document.getElementById("settingsBtn");

// --- Session Tracking ---
function getSessionStart() {
    let start = sessionStorage.getItem(SESSION_START_KEY);
    if (!start) {
        start = new Date().toISOString();
        sessionStorage.setItem(SESSION_START_KEY, start);
    }
    return start;
}

const sessionStart = getSessionStart();

// --- State ---
let currentStageIndex = 0;
let isPressed = false;
let isZenMode = false;
let inspectionInterval = null;
let inspectionTimeLeft = 15;
let inspectionHoldTimeout = null;
let inspectionReadyToStart = false;
let timingInterval = null;
let timingStartTime = 0;

// --- Data Model ---
export class Time {
    constructor(ms = 0, seconds = 0, minutes = 0, category = "3x3") {
        this.ms = Number(ms) || 0;
        this.seconds = Number(seconds) || 0;
        this.minutes = Number(minutes) || 0;
        this.category = String(category || "3x3");
        this.datetime = new Date().toISOString();
        this.modification = "";
        this.ordinalRank = 0;
    }

    get totalMs() {
        return getSolveTotalMs(this);
    }

    toString() {
        return formatMs(this.totalMs);
    }
}

// --- Preferences ---
const showTimeWhileSolving = () => localStorage.getItem("showTimeWhileSolving") === "true";
const showStatsDuringZenPref = () => localStorage.getItem("showStatsDuringZen") === "true";
const showScramblePref = () => localStorage.getItem("showScramble") === "true";
const isReadyStage = () => STAGE_ORDER[currentStageIndex] === "READY";
const shouldShowStats = () => isReadyStage() && (!isZenMode || showStatsDuringZenPref());

// --- Zen Mode ---
function applyZenMode() {
    trEl?.classList.toggle("removed", isZenMode);
    fullscreenBtn?.classList.toggle("removed", isZenMode);

    if (zenParentEl) {
        zenParentEl.style.opacity = isZenMode ? "0.5" : originalZenParentOpacity;
    }

    renderTimerStats();
}

function toggleZenMode() {
    isZenMode = !isZenMode;
    applyZenMode();
}

// --- Timer Stats Rendering ---
function renderSideStats(containerEl, sideItems, solves, context) {
    if (!containerEl) return;

    const enabledItems = (sideItems || []).filter((entry) => entry && entry.enabled);
    containerEl.innerHTML = "";

    enabledItems.forEach((entry) => {
        const meta = STATS_BY_ID.get(entry.id);
        const label = meta ? meta.label : entry.id;
        const value = computeStatValue(entry.id, solves, context);

        const p = document.createElement("p");
        p.dataset.statId = entry.id;
        p.textContent = `${label}: ${value}`;
        containerEl.appendChild(p);
    });
}

export function updateStatsVisibility() {
    const showStats = shouldShowStats();
    statsBLEl?.classList.toggle("removed", !showStats);
    statsBREl?.classList.toggle("removed", !showStats);

    if (!showStats) {
        if (statsBLEl) statsBLEl.innerHTML = "";
        if (statsBREl) statsBREl.innerHTML = "";
    }
}

export function renderTimerStats() {
    updateStatsVisibility();
    if (!shouldShowStats()) return;

    const config = getStatsConfig();
    const solves = getSavedTimes();
    const context = {
        now: new Date(),
        sessionStart
    };

    renderSideStats(statsBLEl, config.left, solves, context);
    renderSideStats(statsBREl, config.right, solves, context);
}

// --- Scramble Logic ---
function generateScramble(length = 20) {
    const scramble = [];
    let lastSide = null;

    for (let i = 0; i < length; i++) {
        const availableSides = SCRAMBLE_SIDES.filter(
            (side) => side !== lastSide && side !== SCRAMBLE_OPPOSITES[lastSide]
        );
        const side = availableSides[Math.floor(Math.random() * availableSides.length)];
        const move = SCRAMBLE_MOVES[Math.floor(Math.random() * SCRAMBLE_MOVES.length)];
        scramble.push(side + move);
        lastSide = side;
    }
    return scramble.join(" ");
}

export function refreshScramble() {
    if (!scrambleEl) return;
    const customLength = parseInt(localStorage.getItem("scrambleLength"), 10) || 20;
    scrambleEl.textContent = generateScramble(customLength);
}

export function updateScrambleVisibility() {
    if (!scrambleEl) return;
    const ready = isReadyStage();
    scrambleEl.classList.toggle("removed", !(ready && showScramblePref()));
}

// --- Timer & Stage Logic ---
function clearAllTimers() {
    clearInterval(inspectionInterval);
    cancelAnimationFrame(timingInterval);
    clearTimeout(inspectionHoldTimeout);
    inspectionInterval = null;
    timingInterval = null;
    inspectionHoldTimeout = null;
}

function applyBackgroundColor() {
    const stage = STAGES[STAGE_ORDER[currentStageIndex]];
    timerSection.style.backgroundColor = isPressed ? stage.bright : stage.normal;
}

function updateStageUI() {
    const stageKey = STAGE_ORDER[currentStageIndex];
    applyBackgroundColor();
    navEl.classList.toggle("removed", stageKey === "INSPECTION" || stageKey === "TIMING");
    updateScrambleVisibility();
    updateStatsVisibility();

    if (stageKey === "READY") {
        refreshScramble();
        renderTimerStats();
    } else if (stageKey === "INSPECTION") {
        timerTextEl.textContent = inspectionTimeLeft;
    }
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
                timerTextEl.textContent = inspectionTimeLeft;
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
            timerTextEl.textContent = "Solving...";
        }

        const updateTimer = () => {
            if (showTimeWhileSolving()) {
                timerTextEl.textContent = formatMs(performance.now() - timingStartTime);
            }
            timingInterval = requestAnimationFrame(updateTimer);
        };
        timingInterval = requestAnimationFrame(updateTimer);
    } else {
        updateStageUI();
    }
}

// --- Input Handlers ---
function handlePressDown() {
    if (timerSection.classList.contains("removed")) return;
    const stageKey = STAGE_ORDER[currentStageIndex];

    if (stageKey === "TIMING") {
        const elapsedMs = performance.now() - timingStartTime;
        clearAllTimers();
        timerTextEl.textContent = formatMs(elapsedMs);

        const minutes = Math.floor(elapsedMs / 60_000);
        const seconds = Math.floor((elapsedMs % 60_000) / 1000);
        const ms = Math.floor(elapsedMs % 1000);

        const savedTimes = getSavedTimes();
        savedTimes.push(new Time(ms, seconds, minutes, "3x3"));
        saveTimes(savedTimes);

        currentStageIndex = 0;
        isPressed = false;
        updateStageUI();
        return;
    }

    if (isPressed) return;
    isPressed = true;

    if (stageKey === "INSPECTION") {
        inspectionReadyToStart = false;
        applyBackgroundColor();
        inspectionHoldTimeout = setTimeout(() => {
            inspectionReadyToStart = true;
            timerSection.style.backgroundColor = STAGES.TIMING.bright;
        }, HOLD_DELAY);
    } else {
        applyBackgroundColor();
    }
}

function handlePressUp() {
    if (timerSection.classList.contains("removed")) return;
    const stageKey = STAGE_ORDER[currentStageIndex];
    if (!isPressed && stageKey !== "TIMING") return;

    if (stageKey === "INSPECTION") {
        clearTimeout(inspectionHoldTimeout);
        inspectionHoldTimeout = null;
        isPressed = false;

        if (inspectionReadyToStart) {
            advanceStage();
        } else {
            applyBackgroundColor();
        }
        return;
    }

    isPressed = false;
    advanceStage();
}

// --- Event Listeners ---
zenModeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleZenMode();
});

fullscreenBtn.addEventListener("click", () => {
    if (!document.documentElement.requestFullscreen) return;
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => { });
    } else {
        document.exitFullscreen?.();
    }
});

settingsBtn.addEventListener("click", () => showSection("settings"));

document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        handlePressDown();
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        handlePressUp();
    }
});

document.addEventListener("touchstart", (e) => {
    if (!e.target.closest("nav")) handlePressDown();
}, { passive: true });

document.addEventListener("touchend", (e) => {
    if (!e.target.closest("nav") || isPressed) handlePressUp();
}, { passive: true });

document.addEventListener("touchcancel", handlePressUp, { passive: true });

// --- Init ---
updateStageUI();
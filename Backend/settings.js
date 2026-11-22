import { refreshScramble, renderTimerStats, updateScrambleVisibility } from "./timer.js";
import { getStatsConfig, saveStatsConfig, showSection } from "./storage.js";
import { STATS_REGISTRY } from "./statsRegistry.js";

// --- DOM Elements ---
const settingsBtn = document.getElementById("settingsBtn");
const settingsBackBtn = document.getElementById("settingsBackBtn");
const showTimeSwitch = document.getElementById("showTimeDuringSolveSwitch");
const showScrambleSwitch = document.getElementById("showScramble");
const scrambleSlider = document.querySelector("#scrambleLength input[type='range']");
const sliderValueSpan = document.querySelector("#scrambleLength .slider-side");

const selectSideTabs = document.querySelectorAll("#selectSide p");
const statsListEl = document.getElementById("statsConfigList");

// --- State ---
const STAT_LABELS = new Map(STATS_REGISTRY.map((s) => [s.id, s.label]));
let currentSide = "left";
let statsConfig = getStatsConfig();

// --- Init General Settings ---
showTimeSwitch.checked = localStorage.getItem("showTimeWhileSolving") === "true";
showScrambleSwitch.checked = localStorage.getItem("showScramble") === "true";

const savedScrambleLength = localStorage.getItem("scrambleLength") || "20";
scrambleSlider.value = savedScrambleLength;
sliderValueSpan.textContent = savedScrambleLength;

function commitAndSyncStats() {
    statsConfig = saveStatsConfig(statsConfig);
    renderTimerStats();
}

function setStatEnabled(statId, enabled) {
    const target = statsConfig[currentSide].find((entry) => entry.id === statId);
    if (!target || target.enabled === enabled) return;
    target.enabled = enabled;
    commitAndSyncStats();
}

function syncOrderFromDom() {
    const orderedIds = [...statsListEl.querySelectorAll("[data-stat-id]")].map(
        (el) => el.dataset.statId
    );
    const byId = new Map(statsConfig[currentSide].map((entry) => [entry.id, entry]));
    const nextList = orderedIds.map((id) => byId.get(id)).filter(Boolean);

    const prevIds = statsConfig[currentSide].map((entry) => entry.id);
    const changed =
        nextList.length === prevIds.length &&
        nextList.some((entry, idx) => entry.id !== prevIds[idx]);

    if (changed) {
        statsConfig[currentSide] = nextList;
        commitAndSyncStats();
    }
}

function getEnabledFirstOrder(sideItems) {
    const enabled = sideItems.filter((item) => item && item.enabled);
    const disabled = sideItems.filter((item) => !item || !item.enabled);
    return [...enabled, ...disabled];
}

// --- Stats List Rendering ---
function renderStatsList() {
    if (!statsListEl) return;

    statsConfig = getStatsConfig();
    const sortedSide = getEnabledFirstOrder(statsConfig[currentSide]);
    const orderChanged = sortedSide.some((item, idx) => item.id !== statsConfig[currentSide][idx]?.id);

    statsConfig[currentSide] = sortedSide;
    if (orderChanged) {
        statsConfig = saveStatsConfig(statsConfig);
    }

    statsListEl.innerHTML = "";

    sortedSide.forEach((item) => {
        const labelText = STAT_LABELS.get(item.id) || item.id;

        const li = document.createElement("li");
        li.className = `stat-config-item${item.enabled ? " is-enabled" : ""}`;
        li.dataset.statId = item.id;

        li.innerHTML = `
            <span class="stat-drag-handle" aria-label="Reorder ${labelText}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M8 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path d="M8 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path d="M8 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path d="M14 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path d="M14 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path d="M14 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                </svg>
            </span>
            <span class="stat-config-label">${labelText}</span>
            <label class="switch stat-config-switch">
                <input type="checkbox" ${item.enabled ? "checked" : ""}>
                <span class="switch-track"></span>
            </label>
        `;

        const checkbox = li.querySelector("input[type='checkbox']");
        checkbox.addEventListener("change", (e) => {
            const isChecked = Boolean(e.target.checked);
            li.classList.toggle("is-enabled", isChecked);
            setStatEnabled(item.id, isChecked);
        });

        const handle = li.querySelector(".stat-drag-handle");
        handle.addEventListener("pointerdown", (e) => startDrag(e, li));

        statsListEl.appendChild(li);
    });
}

// --- Pointer Drag-and-Drop Reordering (Desktop + Mobile) ---
function startDrag(event, itemEl) {
    event.preventDefault();

    const listRect = statsListEl.getBoundingClientRect();
    const itemRect = itemEl.getBoundingClientRect();
    const offsetY = event.clientY - itemRect.top;

    const placeholder = document.createElement("li");
    placeholder.className = "stat-config-placeholder";
    placeholder.style.height = `${itemRect.height}px`;
    placeholder.dataset.statId = itemEl.dataset.statId;

    itemEl.style.width = `${itemRect.width}px`;
    itemEl.style.top = `${itemRect.top - listRect.top}px`;
    itemEl.classList.add("is-dragging");

    statsListEl.insertBefore(placeholder, itemEl);

    const onPointerMove = (moveEvent) => {
        const currentListRect = statsListEl.getBoundingClientRect();
        const top = moveEvent.clientY - currentListRect.top - offsetY;
        itemEl.style.top = `${top}px`;

        const siblings = [...statsListEl.querySelectorAll(".stat-config-item:not(.is-dragging)")];
        const nextSibling = siblings.find((sib) => {
            const sibRect = sib.getBoundingClientRect();
            return moveEvent.clientY < sibRect.top + sibRect.height / 2;
        });

        const prevNext = placeholder.nextElementSibling;
        if (nextSibling) {
            if (prevNext !== nextSibling) {
                statsListEl.insertBefore(placeholder, nextSibling);
                syncOrderFromDom();
            }
        } else if (placeholder.nextElementSibling !== null) {
            statsListEl.appendChild(placeholder);
            syncOrderFromDom();
        }
    };

    const endDrag = () => {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", endDrag);
        document.removeEventListener("pointercancel", endDrag);

        statsListEl.insertBefore(itemEl, placeholder);
        placeholder.remove();

        itemEl.classList.remove("is-dragging");
        itemEl.style.width = "";
        itemEl.style.top = "";

        syncOrderFromDom();
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", endDrag);
    document.addEventListener("pointercancel", endDrag);
}

// --- Side Switcher (Left / Right) ---
selectSideTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const side = tab.dataset.side;
        if (!side || side === currentSide) return;

        currentSide = side;
        selectSideTabs.forEach((t) => {
            if (t.dataset.side === side) {
                t.id = "selectedSide";
            } else if (t.id === "selectedSide") {
                t.removeAttribute("id");
            }
        });

        renderStatsList();
    });
});

// --- General Settings Listeners ---
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

settingsBtn?.addEventListener("click", () => {
    renderStatsList();
});

settingsBackBtn.addEventListener("click", () => {
    commitAndSyncStats();
    showSection("timer");
    updateScrambleVisibility();
    refreshScramble();
});

// --- Initial Render ---
renderStatsList();
renderTimerStats();
import { formatDate, formatMs, getOrdinalSuffix, getSolveTotalMs } from "./formatters.js";
import { getSavedTimes, recalculateRanks, showSection } from "./storage.js";

// --- DOM Elements ---
const timesCard = document.querySelector("#times .card");
const timesBtn = document.getElementById("timesBtn");
const timesBackBtn = document.getElementById("timesBackBtn");
const switchSortOrderBtn = document.getElementById("switchSortOrder");

// --- State ---
const SORT_MODES = ["newest-oldest", "oldest-newest", "quickest-slowest", "slowest-quickest"];
const SORT_LABELS = {
    "newest-oldest": "Sorted: Newest",
    "oldest-newest": "Sorted: Oldest",
    "quickest-slowest": "Sorted: Quickest",
    "slowest-quickest": "Sorted: Slowest"
};
let currentSortIndex = 0;

// --- Popup Notification Helper ---
function showSortPopup(message) {
    let popup = document.querySelector(".sort-popup");
    if (!popup) {
        popup = document.createElement("div");
        popup.className = "sort-popup glassy";
        document.body.appendChild(popup);
    }

    popup.textContent = message;
    popup.classList.add("visible");

    clearTimeout(popup._hideTimeout);
    popup._hideTimeout = setTimeout(() => {
        popup.classList.remove("visible");
    }, 2000);
}

// --- Render ---
export function renderTimes() {
    if (!timesCard) return;

    let savedTimes = recalculateRanks(getSavedTimes());

    if (savedTimes.length === 0) {
        timesCard.innerHTML = `<p style="padding: 24px; color: #808080; text-align: center;">No solves yet</p>`;
        return;
    }

    const mode = SORT_MODES[currentSortIndex];
    savedTimes.sort((a, b) => {
        const timeA = getSolveTotalMs(a);
        const timeB = getSolveTotalMs(b);
        const dateA = new Date(a.datetime).getTime();
        const dateB = new Date(b.datetime).getTime();

        if (mode === "newest-oldest") return dateB - dateA;
        if (mode === "oldest-newest") return dateA - dateB;
        if (mode === "quickest-slowest") return timeA - timeB;
        if (mode === "slowest-quickest") return timeB - timeA;
        return 0;
    });

    timesCard.innerHTML = "";

    savedTimes.forEach((solve) => {
        const timeStr = formatMs(getSolveTotalMs(solve));
        const dateStr = formatDate(solve.datetime);
        const numberStr = solve.ordinalRank ? getOrdinalSuffix(solve.ordinalRank) : "";
        const modificationStr = solve.modification || "";

        const itemDiv = document.createElement("div");
        itemDiv.className = "timelistItem";
        itemDiv.innerHTML = `
            <p class="timelistTime">${timeStr}</p>
            <p class="timelistDate">${dateStr}</p>
            <p class="timelistNumber">${numberStr}</p>
            <p class="timelistModification">${modificationStr}</p>
            <svg class="timelistOptions" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                <path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                <path d="M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
            </svg>
        `;

        timesCard.appendChild(itemDiv);
    });
}

// --- Event Listeners ---
timesBtn?.addEventListener("click", () => {
    renderTimes();
    showSection("times");
});

timesBackBtn?.addEventListener("click", () => showSection("timer"));

switchSortOrderBtn?.addEventListener("click", () => {
    currentSortIndex = (currentSortIndex + 1) % SORT_MODES.length;
    renderTimes();
    showSortPopup(SORT_LABELS[SORT_MODES[currentSortIndex]]);
});
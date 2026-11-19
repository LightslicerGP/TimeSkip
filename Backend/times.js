import { formatDate, formatMs, getOrdinalSuffix, getSolveTotalMs } from "./formatters.js";
import { getSavedTimes, recalculateRanks, saveTimes, showSection } from "./storage.js";

// --- DOM Elements ---
const timesCard = document.querySelector("#times .card");
const timesBtn = document.getElementById("timesBtn");
const timesBackBtn = document.getElementById("timesBackBtn");
const switchSortOrderBtn = document.getElementById("switchSortOrder");
const exportTimesBtn = document.getElementById("exportTimes");
const importTimesBtn = document.getElementById("importTimes");

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
function showPopup(message) {
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

// --- Item Options Popup Helper ---
function getOrCreateOptionsPopup() {
    let popup = document.querySelector(".item-options-popup");
    if (!popup) {
        popup = document.createElement("div");
        popup.className = "item-options-popup glassy";
        popup.innerHTML = `
            <button type="button" class="item-option-btn">+2</button>
            <button type="button" class="item-option-btn">DNF</button>
            <button type="button" class="item-option-btn">Delete</button>
        `;
        document.body.appendChild(popup);
    }
    return popup;
}

function hideOptionsPopup() {
    const popup = document.querySelector(".item-options-popup");
    if (popup) {
        popup.classList.remove("open");
    }
}

function openOptionsPopup(svgElement) {
    const popup = getOrCreateOptionsPopup();
    const rect = svgElement.getBoundingClientRect();

    // Align top-right of popup with top-right of SVG; expands leftward and downward
    popup.style.top = `${rect.top}px`;
    popup.style.right = `${window.innerWidth - rect.right}px`;
    popup.style.left = "auto";
    popup.classList.add("open");
}

// --- Export / Import Helpers ---
function exportTimesToJson() {
    const times = recalculateRanks(getSavedTimes());
    const blob = new Blob([JSON.stringify(times, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `TimeSkip-times-export-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    showPopup("Exported JSON");
}

function importTimesFromJson() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";

    input.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const parsed = JSON.parse(text);

            if (!Array.isArray(parsed)) {
                showPopup("Invalid JSON format");
                return;
            }

            const validSolves = parsed
                .filter((item) => item && typeof item === "object")
                .map((item) => ({
                    ms: Number(item.ms) || 0,
                    seconds: Number(item.seconds) || 0,
                    minutes: Number(item.minutes) || 0,
                    category: String(item.category || "3x3"),
                    datetime: item.datetime || new Date().toISOString(),
                    modification: item.modification || "",
                    ordinalRank: 0
                }));

            saveTimes(validSolves);
            renderTimes();
            showPopup(`Imported ${validSolves.length} time${validSolves.length === 1 ? "" : "s"}`);
        } catch {
            showPopup("Failed to import JSON");
        }
    });

    input.click();
}

// --- Render ---
export function renderTimes() {
    if (!timesCard) return;

    hideOptionsPopup();
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

        const optionsSvg = itemDiv.querySelector(".timelistOptions");
        optionsSvg?.addEventListener("click", (event) => {
            event.stopPropagation();
            openOptionsPopup(optionsSvg);
        });

        timesCard.appendChild(itemDiv);
    });
}

// --- Event Listeners ---
timesBtn?.addEventListener("click", () => {
    renderTimes();
    showSection("times");
});

timesBackBtn?.addEventListener("click", () => {
    hideOptionsPopup();
    showSection("timer");
});

switchSortOrderBtn?.addEventListener("click", () => {
    currentSortIndex = (currentSortIndex + 1) % SORT_MODES.length;
    renderTimes();
    showPopup(SORT_LABELS[SORT_MODES[currentSortIndex]]);
});

exportTimesBtn?.addEventListener("click", exportTimesToJson);
importTimesBtn?.addEventListener("click", importTimesFromJson);

document.addEventListener("click", (event) => {
    if (!event.target.closest(".item-options-popup") && !event.target.closest(".timelistOptions")) {
        hideOptionsPopup();
    }
});
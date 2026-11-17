import { recalculateRanks } from "./timer.js";
import { formatSolveTime, formatDate, getOrdinalSuffix } from "./formatters.js";

const timesBackBtn = document.getElementById("timesBackBtn");
const timesSection = document.getElementById("times");
const timerBackgroundElement = document.getElementById("timer");
const timesBtn = document.getElementById("timesBtn");

export function renderTimes() {
    const timesCard = timesSection.querySelector(".card");
    if (!timesCard) return;

    let savedTimes = JSON.parse(localStorage.getItem("solveTimes") || "[]");

    if (savedTimes.length === 0) {
        timesCard.innerHTML = `<p style="padding: 24px; color: #808080; text-align: center;">No solves yet</p>`;
        return;
    }

    savedTimes = recalculateRanks(savedTimes);

    timesCard.innerHTML = "";

    [...savedTimes].reverse().forEach((solve) => {
        const timeStr = formatSolveTime(solve);
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

timesBtn.addEventListener("click", () => {
    renderTimes();
    timesSection.classList.remove("removed");
    timerBackgroundElement.classList.add("removed");
});

timesBackBtn.addEventListener("click", () => {
    timerBackgroundElement.classList.remove("removed");
    timesSection.classList.add("removed");
});
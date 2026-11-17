import { recalculateRanks } from "./timer.js";
import { formatSolveTime, getOrdinalSuffixAbbr } from "./formatters.js";

const viewLeaderboardBtn = document.getElementById("viewLeaderboard");
const leaderboardSection = document.getElementById("leaderboard");
const leaderboardBackBtn = document.getElementById("leaderboardBackBtn");
const timesSection = document.getElementById("times");
const timerSection = document.getElementById("timer");
const settingsSection = document.getElementById("settings");

export function renderLeaderboard() {
    const leaderboardCard = leaderboardSection.querySelector(".card");
    if (!leaderboardCard) return;

    let savedTimes = JSON.parse(localStorage.getItem("solveTimes") || "[]");

    if (savedTimes.length === 0) {
        leaderboardCard.innerHTML = `<p style="padding: 24px; color: #808080; text-align: center;">No solves for leaderboard yet</p>`;
        return;
    }

    savedTimes = recalculateRanks(savedTimes);
    savedTimes.sort((a, b) => a.ordinalRank - b.ordinalRank);

    leaderboardCard.innerHTML = "";

    savedTimes.forEach((solve) => {
        const timeStr = formatSolveTime(solve);
        const rankStr = `${solve.ordinalRank}${getOrdinalSuffixAbbr(solve.ordinalRank)}`;

        const itemDiv = document.createElement("div");
        itemDiv.className = "timelistItem";

        itemDiv.innerHTML = `
            <p class="timelistTime">${timeStr}</p>
            <p class="timelistDate">Rank: ${rankStr}</p>
            <p class="timelistNumber">${solve.category || "3x3"}</p>
        `;

        leaderboardCard.appendChild(itemDiv);
    });
}

if (viewLeaderboardBtn) {
    viewLeaderboardBtn.addEventListener("click", () => {
        timerSection.classList.add("removed");
        timesSection.classList.add("removed");
        settingsSection.classList.add("removed");

        renderLeaderboard();
        leaderboardSection.classList.remove("removed");
    });
}

if (leaderboardBackBtn) {
    leaderboardBackBtn.addEventListener("click", () => {
        leaderboardSection.classList.add("removed");
        timesSection.classList.remove("removed");
    });
}
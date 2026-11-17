import { formatMs, getOrdinalSuffix, getSolveTotalMs } from "./formatters.js";
import { getSavedTimes, recalculateRanks, showSection } from "./storage.js";

// --- DOM Elements ---
const leaderboardCard = document.querySelector("#leaderboard .card");
const viewLeaderboardBtn = document.getElementById("viewLeaderboard");
const leaderboardBackBtn = document.getElementById("leaderboardBackBtn");

// --- Render ---
export function renderLeaderboard() {
    if (!leaderboardCard) return;

    const savedTimes = recalculateRanks(getSavedTimes());

    if (savedTimes.length === 0) {
        leaderboardCard.innerHTML = `<p style="padding: 24px; color: #808080; text-align: center;">No solves for leaderboard yet</p>`;
        return;
    }

    savedTimes.sort((a, b) => a.ordinalRank - b.ordinalRank);
    leaderboardCard.innerHTML = "";

    savedTimes.forEach((solve) => {
        const timeStr = formatMs(getSolveTotalMs(solve));
        const rankStr = getOrdinalSuffix(solve.ordinalRank);

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

// --- Event Listeners ---
viewLeaderboardBtn?.addEventListener("click", () => {
    renderLeaderboard();
    showSection("leaderboard");
});

leaderboardBackBtn?.addEventListener("click", () => showSection("times"));
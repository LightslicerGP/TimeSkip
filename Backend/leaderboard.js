import { recalculateRanks } from "./timer.js";

const viewLeaderboardBtn = document.getElementById("viewLeaderboard");
const leaderboardSection = document.getElementById("leaderboard");
const leaderboardBackBtn = document.getElementById("leaderboardBackBtn");
const timesSection = document.getElementById("times");
const timerSection = document.getElementById("timer");
const settingsSection = document.getElementById("settings");

function formatSolveTime(solve) {
    const totalMs = (solve.minutes || 0) * 60_000 + (solve.seconds || 0) * 1000 + (solve.ms || 0);
    const total = Math.max(0, Math.floor(totalMs));
    const minutes = Math.floor(total / 60_000);
    const seconds = Math.floor((total % 60_000) / 1000);
    const decimalPlaces = 3;
    const divisor = Math.pow(10, 3 - decimalPlaces);
    const subMs = Math.floor((total % 1000) / divisor);

    const paddedSubMs = String(subMs).padStart(decimalPlaces, "0");
    const paddedSeconds = String(seconds).padStart(2, "0");

    if (minutes > 0) {
        return `${minutes}:${paddedSeconds}.${paddedSubMs}`;
    }
    return `${seconds}.${paddedSubMs}`;
}

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

function getOrdinalSuffixAbbr(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

if (viewLeaderboardBtn) {
    viewLeaderboardBtn.addEventListener("click", () => {
        // Hide everything else by adding 'removed'
        timerSection.classList.add("removed");
        timesSection.classList.add("removed");
        settingsSection.classList.add("removed");

        // Show leaderboard
        renderLeaderboard();
        leaderboardSection.classList.remove("removed");
    });
}

if (leaderboardBackBtn) {
    leaderboardBackBtn.addEventListener("click", () => {
        leaderboardSection.classList.add("removed");
        timesSection.classList.remove("removed"); // Return back to the times section
    });
}
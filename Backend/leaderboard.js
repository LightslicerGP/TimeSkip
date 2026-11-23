import { showSection } from "./storage.js";

// --- DOM Elements ---
const viewLeaderboardBtn = document.getElementById("viewLeaderboard");
const leaderboardBackBtn = document.getElementById("leaderboardBackBtn");
const leaderboardCard = document.querySelector("#leaderboard .card");

// --- Leaderboard Data ---
export const LEADERBOARD_ENTRIES = [
    {
        author: "Hisham Chowdhury",
        time: "11.329",
        date: "10.29.26 7:33pm"
    },
    {
        author: "Jorge Terrazas",
        time: "23.618",
        date: "11.19.26 3:09pm"
    }
];

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// --- Render ---
export function renderLeaderboard(entries = LEADERBOARD_ENTRIES) {
    if (!leaderboardCard) return;

    if (!Array.isArray(entries) || entries.length === 0) {
        leaderboardCard.innerHTML = `<p style="padding: 24px; color: #808080; text-align: center;">No leaderboard entries yet</p>`;
        return;
    }

    leaderboardCard.innerHTML = "";

    entries.forEach((entry) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "leaderboardItem";
        itemDiv.innerHTML = `
            <p class="itemAuthor">${escapeHtml(entry.author)}</p>
            <p class="itemTime">${escapeHtml(entry.time)}</p>
            <p class="itemDate">${escapeHtml(entry.date)}</p>
        `;
        leaderboardCard.appendChild(itemDiv);
    });
}

// --- Event Listeners ---
viewLeaderboardBtn?.addEventListener("click", () => {
    renderLeaderboard();
    showSection("leaderboard");
});

leaderboardBackBtn?.addEventListener("click", () => {
    showSection("times");
});

// --- Init ---
renderLeaderboard();
import { showSection } from "./storage.js";

// --- DOM Elements ---
const viewLeaderboardBtn = document.getElementById("viewLeaderboard");
const leaderboardBackBtn = document.getElementById("leaderboardBackBtn");

// --- Event Listeners ---
viewLeaderboardBtn?.addEventListener("click", () => {
    showSection("leaderboard");
});

leaderboardBackBtn?.addEventListener("click", () => {
    showSection("times");
});
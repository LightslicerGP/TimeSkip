import { getSolveTotalMs } from "./formatters.js";

const SECTIONS = ["timer", "times", "leaderboard", "graph", "settings"];

export function showSection(targetId) {
    SECTIONS.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("removed", id !== targetId);
    });
}

export function getSavedTimes() {
    return JSON.parse(localStorage.getItem("solveTimes") || "[]");
}

export function saveTimes(times) {
    const ranked = recalculateRanks(times);
    localStorage.setItem("solveTimes", JSON.stringify(ranked));
    return ranked;
}

export function recalculateRanks(savedTimes) {
    const categories = [...new Set(savedTimes.map((t) => t.category || "3x3"))];

    categories.forEach((cat) => {
        const catTimes = savedTimes.filter((t) => (t.category || "3x3") === cat);
        catTimes.sort((a, b) => getSolveTotalMs(a) - getSolveTotalMs(b));
        catTimes.forEach((solve, index) => {
            solve.ordinalRank = index + 1;
        });
    });

    return savedTimes;
}
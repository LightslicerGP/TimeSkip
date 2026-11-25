import { getSolveTotalMs } from "./formatters.js";
import { STATS_REGISTRY } from "./statsRegistry.js";

const SECTIONS = ["timer", "times", "leaderboard", "graph", "profile", "settings"];
const STATS_CONFIG_KEY = "timerStatsConfig";

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

function normalizeSideList(savedList = []) {
    const validIds = new Set(STATS_REGISTRY.map((stat) => stat.id));
    const seen = new Set();
    const result = [];

    savedList.forEach((item) => {
        if (item && validIds.has(item.id) && !seen.has(item.id)) {
            seen.add(item.id);
            result.push({
                id: item.id,
                enabled: Boolean(item.enabled)
            });
        }
    });

    STATS_REGISTRY.forEach((stat) => {
        if (!seen.has(stat.id)) {
            result.push({
                id: stat.id,
                enabled: false
            });
        }
    });

    return result;
}

export function getStatsConfig() {
    try {
        const raw = JSON.parse(localStorage.getItem(STATS_CONFIG_KEY) || "{}");
        return {
            left: normalizeSideList(raw.left),
            right: normalizeSideList(raw.right)
        };
    } catch {
        return {
            left: normalizeSideList([]),
            right: normalizeSideList([])
        };
    }
}

export function saveStatsConfig(config) {
    const normalized = {
        left: normalizeSideList(config.left),
        right: normalizeSideList(config.right)
    };
    localStorage.setItem(STATS_CONFIG_KEY, JSON.stringify(normalized));
    return normalized;
}
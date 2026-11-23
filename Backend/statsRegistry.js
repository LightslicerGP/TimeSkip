import { formatMs, getSolveTotalMs } from "./formatters.js";

function getEffectiveMs(solve) {
    if (!solve) return null;
    const mod = String(solve.modification || "").toUpperCase();
    if (mod === "DNF") return Infinity;
    const base = getSolveTotalMs(solve);
    return mod === "+2" ? base + 2000 : base;
}

function isSameLocalDay(isoString, refDate = new Date()) {
    if (!isoString) return false;
    const d = new Date(isoString);
    return (
        d.getFullYear() === refDate.getFullYear() &&
        d.getMonth() === refDate.getMonth() &&
        d.getDate() === refDate.getDate()
    );
}

function isInSession(isoString, sessionStartIso) {
    if (!isoString || !sessionStartIso) return true;
    return new Date(isoString).getTime() >= new Date(sessionStartIso).getTime();
}

function meanOfFinite(values) {
    if (!values.length) return null;
    if (values.some((v) => !Number.isFinite(v))) return Infinity;
    const sum = values.reduce((acc, v) => acc + v, 0);
    return sum / values.length;
}

// Deletes the single best and single worst solve in the window (DNF = worst),
// then averages the remaining middle solves.
function truncatedAverage(windowValues) {
    if (!windowValues.length) return null;
    if (windowValues.length < 3) {
        return meanOfFinite(windowValues);
    }
    const sorted = [...windowValues].sort((a, b) => a - b);
    const trimmed = sorted.slice(1, -1);
    return meanOfFinite(trimmed);
}

// WCA average rule:
// - Window < 5: mean of all solves; any DNF makes the average DNF.
// - Window >= 5: drop 1 best and 1 worst; >= 2 DNFs makes the average DNF.
function wcaAverage(windowValues) {
    if (!windowValues.length) return null;
    const dnfCount = windowValues.filter((v) => !Number.isFinite(v)).length;

    if (windowValues.length < 5) {
        return dnfCount > 0 ? Infinity : meanOfFinite(windowValues);
    }

    if (dnfCount >= 2) return Infinity;

    const sorted = [...windowValues].sort((a, b) => a - b);
    const trimmed = sorted.slice(1, -1);
    return meanOfFinite(trimmed);
}

function getAllWindows(values, size) {
    if (values.length < size) return [];
    const windows = [];
    for (let i = 0; i <= values.length - size; i++) {
        windows.push(values.slice(i, i + size));
    }
    return windows;
}

function formatMetricMs(val) {
    if (val === null || val === undefined || Number.isNaN(val)) return "-";
    if (!Number.isFinite(val)) return "DNF";
    return formatMs(val);
}

function formatDeltaMs(delta) {
    if (delta === null || delta === undefined || !Number.isFinite(delta)) return "-";
    const sign = delta < 0 ? "-" : delta > 0 ? "+" : "";
    return `${sign}${formatMs(Math.abs(delta))}s`;
}

function computeLastWindowAvg(solves, size, truncated = false) {
    const values = solves.map(getEffectiveMs);
    if (values.length < size) return "-";
    const slice = values.slice(-size);
    const result = truncated ? truncatedAverage(slice) : wcaAverage(slice);
    return formatMetricMs(result);
}

function computeBestWindowAvg(solves, size, truncated = false) {
    const values = solves.map(getEffectiveMs);
    const windows = getAllWindows(values, size);
    if (!windows.length) return "-";

    const validAvgs = windows
        .map((win) => (truncated ? truncatedAverage(win) : wcaAverage(win)))
        .filter((avg) => avg !== null && Number.isFinite(avg));

    if (!validAvgs.length) return "DNF";
    return formatMetricMs(Math.min(...validAvgs));
}

function computeBestSuccessiveImprovement(solves, size) {
    const values = solves.map(getEffectiveMs);
    const windows = getAllWindows(values, size);
    if (windows.length < 2) return "-";

    const avgs = windows.map((win) => wcaAverage(win));
    let bestDelta = Infinity;

    for (let i = 1; i < avgs.length; i++) {
        const prev = avgs[i - 1];
        const curr = avgs[i];
        if (Number.isFinite(prev) && Number.isFinite(curr)) {
            const delta = curr - prev;
            if (delta < bestDelta) {
                bestDelta = delta;
            }
        }
    }

    return Number.isFinite(bestDelta) ? formatDeltaMs(bestDelta) : "-";
}

function computeExtremum(filteredSolves, mode) {
    if (!filteredSolves.length) return "-";

    const finiteTimes = filteredSolves
        .map(getEffectiveMs)
        .filter((v) => v !== null && Number.isFinite(v));

    if (!finiteTimes.length) {
        return "DNF";
    }

    const result = mode === "min" ? Math.min(...finiteTimes) : Math.max(...finiteTimes);
    return formatMetricMs(result);
}

function computeFilteredMean(filteredSolves) {
    if (!filteredSolves.length) return "-";
    const values = filteredSolves.map(getEffectiveMs);
    return formatMetricMs(meanOfFinite(values));
}

export const STATS_REGISTRY = [
    {
        id: "ao3",
        label: "ao3",
        compute: (solves) => computeLastWindowAvg(solves, 3, false)
    },
    {
        id: "best-ao3",
        label: "best ao3",
        compute: (solves) => computeBestWindowAvg(solves, 3, false)
    },
    {
        id: "best-ao3-improvement",
        label: "best ao3 improvement",
        compute: (solves) => computeBestSuccessiveImprovement(solves, 3)
    },

    {
        id: "ao5",
        label: "ao5",
        compute: (solves) => computeLastWindowAvg(solves, 5, false)
    },
    {
        id: "truncated-ao5",
        label: "truncated ao5",
        compute: (solves) => computeLastWindowAvg(solves, 5, true)
    },
    {
        id: "best-ao5",
        label: "best ao5",
        compute: (solves) => computeBestWindowAvg(solves, 5, false)
    },
    {
        id: "best-truncated-ao5",
        label: "best truncated ao5",
        compute: (solves) => computeBestWindowAvg(solves, 5, true)
    },
    {
        id: "best-ao5-improvement",
        label: "best ao5 improvement",
        compute: (solves) => computeBestSuccessiveImprovement(solves, 5)
    },

    {
        id: "ao7",
        label: "ao7",
        compute: (solves) => computeLastWindowAvg(solves, 7, false)
    },
    {
        id: "truncated-ao7",
        label: "truncated ao7",
        compute: (solves) => computeLastWindowAvg(solves, 7, true)
    },
    {
        id: "best-ao7",
        label: "best ao7",
        compute: (solves) => computeBestWindowAvg(solves, 7, false)
    },
    {
        id: "best-truncated-ao7",
        label: "best truncated ao7",
        compute: (solves) => computeBestWindowAvg(solves, 7, true)
    },
    {
        id: "best-ao7-improvement",
        label: "best ao7 improvement",
        compute: (solves) => computeBestSuccessiveImprovement(solves, 7)
    },

    {
        id: "ao12",
        label: "ao12",
        compute: (solves) => computeLastWindowAvg(solves, 12, false)
    },
    {
        id: "truncated-ao12",
        label: "truncated ao12",
        compute: (solves) => computeLastWindowAvg(solves, 12, true)
    },
    {
        id: "best-ao12",
        label: "best ao12",
        compute: (solves) => computeBestWindowAvg(solves, 12, false)
    },
    {
        id: "best-truncated-ao12",
        label: "best truncated ao12",
        compute: (solves) => computeBestWindowAvg(solves, 12, true)
    },
    {
        id: "best-ao12-improvement",
        label: "best ao12 improvement",
        compute: (solves) => computeBestSuccessiveImprovement(solves, 12)
    },

    {
        id: "last-time",
        label: "last time",
        compute: (solves) => {
            if (!solves.length) return "-";
            return formatMetricMs(getEffectiveMs(solves[solves.length - 1]));
        }
    },
    {
        id: "all-solves",
        label: "all solves",
        compute: (solves) => String(solves.length)
    },
    {
        id: "todays-solves",
        label: "today's solves",
        compute: (solves, ctx) =>
            String(solves.filter((s) => isSameLocalDay(s.datetime, ctx.now)).length)
    },
    {
        id: "session-solves",
        label: "session solves",
        compute: (solves, ctx) =>
            String(solves.filter((s) => isInSession(s.datetime, ctx.sessionStart)).length)
    },
    {
        id: "total-average",
        label: "total average",
        compute: (solves) => computeFilteredMean(solves)
    },
    {
        id: "session-average",
        label: "session average",
        compute: (solves, ctx) =>
            computeFilteredMean(solves.filter((s) => isInSession(s.datetime, ctx.sessionStart)))
    },
    {
        id: "today-average",
        label: "today average",
        compute: (solves, ctx) =>
            computeFilteredMean(solves.filter((s) => isSameLocalDay(s.datetime, ctx.now)))
    },
    {
        id: "ao50",
        label: "ao50",
        compute: (solves) => computeLastWindowAvg(solves, 50, false)
    },
    {
        id: "ao100",
        label: "ao100",
        compute: (solves) => computeLastWindowAvg(solves, 100, false)
    },
    {
        id: "ao250",
        label: "ao250",
        compute: (solves) => computeLastWindowAvg(solves, 250, false)
    },
    {
        id: "ao500",
        label: "ao500",
        compute: (solves) => computeLastWindowAvg(solves, 500, false)
    },
    {
        id: "ao1000",
        label: "ao1000",
        compute: (solves) => computeLastWindowAvg(solves, 1000, false)
    },

    {
        id: "best-time",
        label: "best time",
        compute: (solves) => computeExtremum(solves, "min")
    },
    {
        id: "best-time-today",
        label: "today best",
        compute: (solves, ctx) =>
            computeExtremum(solves.filter((s) => isSameLocalDay(s.datetime, ctx.now)), "min")
    },
    {
        id: "best-time-session",
        label: "session best",
        compute: (solves, ctx) =>
            computeExtremum(solves.filter((s) => isInSession(s.datetime, ctx.sessionStart)), "min")
    },
    {
        id: "worst-time",
        label: "worst time",
        compute: (solves) => computeExtremum(solves, "max")
    },
    {
        id: "worst-time-today",
        label: "today worst",
        compute: (solves, ctx) =>
            computeExtremum(solves.filter((s) => isSameLocalDay(s.datetime, ctx.now)), "max")
    },
    {
        id: "worst-time-session",
        label: "session worst",
        compute: (solves, ctx) =>
            computeExtremum(solves.filter((s) => isInSession(s.datetime, ctx.sessionStart)), "max")
    }
];

export const STATS_BY_ID = new Map(STATS_REGISTRY.map((stat) => [stat.id, stat]));

export function computeStatValue(statId, solves, context = {}) {
    const stat = STATS_BY_ID.get(statId);
    if (!stat || typeof stat.compute !== "function") return "-";
    return stat.compute(solves, context);
}
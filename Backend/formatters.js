const DECIMAL_PLACES = 3;

export function getOrdinalSuffix(n, includeNumber = true) {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = n % 100;
    const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
    return includeNumber ? `${n}${suffix}` : suffix;
}

export function formatDate(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2);

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;

    return `${month}.${day}.${year} ${hours}:${minutes}${ampm}`;
}

export function formatMs(elapsedMs) {
    const total = Math.max(0, Math.floor(elapsedMs));
    const minutes = Math.floor(total / 60_000);
    const seconds = Math.floor((total % 60_000) / 1000);
    const divisor = Math.pow(10, 3 - DECIMAL_PLACES);
    const subMs = Math.floor((total % 1000) / divisor);

    const paddedSubMs = String(subMs).padStart(DECIMAL_PLACES, "0");
    const paddedSeconds = String(seconds).padStart(2, "0");

    return minutes > 0
        ? `${minutes}:${paddedSeconds}.${paddedSubMs}`
        : `${seconds}.${paddedSubMs}`;
}

export function getSolveTotalMs(solve) {
    return (solve.minutes || 0) * 60_000 + (solve.seconds || 0) * 1000 + (solve.ms || 0);
}
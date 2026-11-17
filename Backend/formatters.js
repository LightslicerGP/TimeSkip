export function getOrdinalSuffix(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function getOrdinalSuffixAbbr(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

export function formatDate(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2);

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${month}.${day}.${year} ${hours}:${minutes}${ampm}`;
}

export function formatSolveTime(solve) {
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
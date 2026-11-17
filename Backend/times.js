const timesBackBtn = document.getElementById("timesBackBtn");
const timesSection = document.getElementById("times");
const timerBackgroundElement = document.getElementById("timer");
const timesBtn = document.getElementById("timesBtn");

function getOrdinalSuffix(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDate(isoString) {
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

// Renders saved solves into the card container
export function renderTimes() {
    const timesCard = timesSection.querySelector(".card");
    if (!timesCard) return;

    const savedTimes = JSON.parse(localStorage.getItem("solveTimes") || "[]");

    if (savedTimes.length === 0) {
        timesCard.innerHTML = `<p style="padding: 24px; color: #808080; text-align: center;">No solves yet</p>`;
        return;
    }

    timesCard.innerHTML = "";

    [...savedTimes].reverse().forEach((solve) => {
        const timeStr = formatSolveTime(solve);
        const dateStr = formatDate(solve.datetime);
        const numberStr = solve.solveNumber ? getOrdinalSuffix(solve.solveNumber) : "";
        const modificationStr = solve.modification || ""; // Optional DNF / +2 field

        const itemDiv = document.createElement("div");
        itemDiv.className = "timelistItem";

        itemDiv.innerHTML = `
            <p class="timelistTime">${timeStr}</p>
            <p class="timelistDate">${dateStr}</p>
            <p class="timelistNumber">${numberStr}</p>
            <p class="timelistModification">${modificationStr}</p>
            <svg class="timelistOptions" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                <path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                <path d="M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
            </svg>
        `;

        timesCard.appendChild(itemDiv);
    });
}

timesBtn.addEventListener("click", () => {
    renderTimes();
    timesSection.classList.remove("removed");
    timerBackgroundElement.classList.add("removed");
});

timesBackBtn.addEventListener("click", () => {
    timerBackgroundElement.classList.remove("removed");
    timesSection.classList.add("removed");
});
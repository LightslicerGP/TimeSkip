import "./Backend/timer.js";
import "./Backend/settings.js";
import "./Backend/navigation.js";
import "./Backend/times.js";
import "./Backend/leaderboard.js";
import { openTabSection } from "./Backend/navigation.js";

const timesBtn = document.getElementById("timesBtn");
timesBtn?.addEventListener("click", () => {
    openTabSection("times");
});
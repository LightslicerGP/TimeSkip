import { showSection } from "./storage.js";
import { renderTimes } from "./times.js";

const TAB_SECTIONS = ["times", "leaderboard", "graph"];
const mainNav = document.querySelector("body > nav");
const backBtns = document.querySelectorAll("body > nav #backBtn");

function syncTabSelection(sectionId) {
    const targetIndex = TAB_SECTIONS.indexOf(sectionId);
    if (targetIndex === -1) return;

    [document.getElementById("small"), document.getElementById("medium")].forEach((barContainer) => {
        if (!barContainer) return;
        const items = barContainer.querySelectorAll(".tab-bar .tab-item");
        items.forEach((item, idx) => {
            if (idx === targetIndex) {
                item.id = "selected";
            } else if (item.id === "selected") {
                item.removeAttribute("id");
            }
        });
    });
}

export function openTabSection(sectionId) {
    if (!TAB_SECTIONS.includes(sectionId)) return;

    mainNav?.classList.remove("removed");
    syncTabSelection(sectionId);
    showSection(sectionId);

    if (sectionId === "times") {
        renderTimes();
    }
}

export function closeTabSection() {
    mainNav?.classList.add("removed");
    showSection("timer");
}

function bindTabBar(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const items = container.querySelectorAll(".tab-bar .tab-item");
    items.forEach((item, index) => {
        const sectionId = TAB_SECTIONS[index];
        if (!sectionId) return;

        item.addEventListener("click", () => {
            openTabSection(sectionId);
        });
    });
}

bindTabBar("small");
bindTabBar("medium");

backBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        closeTabSection();
    });
});
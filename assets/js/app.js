import {
  parseRhythmRow,
  parsePatternTextToArray,
  patternToText,
  playPatternArray,
  STEPS_PER_LANE,
} from "./rhythm.js";
import { loadSamples } from "./audio.js";

const LANES = 8;
const pattern = Array.from({ length: LANES }, () =>
  new Array(STEPS_PER_LANE).fill(false)
);

const laneLabels = [
  "Crash Cymbal",
  "Hi-Hat",
  "Ride Cymbal",
  "High Tom",
  "Mid Tom",
  "Snare",
  "Floor Tom",
  "Kick",
];

let drumGrid, patternInput;
let isPlaying = false;

// Pattern handling
function loadPatternFromText(input) {
  const lines = input.trim().split("\n");
  if (lines.length !== LANES) throw new Error(`Expected ${LANES} lines`);

  lines.forEach((line, lane) => {
    if (line.length !== STEPS_PER_LANE) {
      throw new Error(
        `Line ${lane + 1} must have ${STEPS_PER_LANE} characters`
      );
    }
    pattern[lane] = parseRhythmRow(line, STEPS_PER_LANE);
  });
}

// Pattern storage
function savePatternToLocalStorage(storageKey) {
  const textPattern = patternToText(pattern);
  localStorage.setItem(storageKey, textPattern);
}

let maxActiveSteps = 0;

function updateStepCounter() {
  const activeCount = patternToText(pattern)
    .split("")
    .filter((c) => c === "x").length;
  const counterEl = document.getElementById("step-counter");
  if (counterEl) {
    counterEl.textContent = `${activeCount} / ${maxActiveSteps}`;
  }
}

function createGrid(storageKey) {
  const labelStates = new Array(LANES).fill(0);

  for (let lane = 0; lane < LANES; lane++) {
    const row = document.createElement("div");
    row.classList.add("lane-row");

    const label = document.createElement("div");
    label.classList.add("lane-label");
    label.textContent = laneLabels[lane] || `Lane ${lane + 1}`;
    row.appendChild(label);

    label.addEventListener("click", () => {
      let activeCount = 0;
      for (let step = 0; step < STEPS_PER_LANE; step++) {
        if (pattern[lane][step]) activeCount++;
      }
      let newState = activeCount !== STEPS_PER_LANE;
      for (let step = 0; step < STEPS_PER_LANE; step++) {
        pattern[lane][step] = newState;
      }
      labelStates[lane] = newState ? 1 : 0;
      updateGridUI();
      savePatternToLocalStorage(storageKey);
      updateStepCounter();
    });

    for (let step = 0; step < STEPS_PER_LANE; step++) {
      const stepDiv = document.createElement("div");
      stepDiv.classList.add("step");
      stepDiv.addEventListener("click", () => {
        pattern[lane][step] = !pattern[lane][step];
        stepDiv.classList.toggle("active");
        savePatternToLocalStorage(storageKey);
        updateStepCounter();
      });
      row.appendChild(stepDiv);
    }

    drumGrid.appendChild(row);
  }
}

function updateGridUI() {
  const rows = drumGrid.querySelectorAll(".lane-row");
  rows.forEach((row, lane) => {
    const steps = row.querySelectorAll(".step");
    for (let step = 0; step < STEPS_PER_LANE; step++) {
      steps[step].classList.toggle("active", pattern[lane][step]);
    }
  });
  updateStepCounter();
}

function initDrumGrid(storageKey) {
  drumGrid = document.getElementById("drumGrid");
  patternInput = document.getElementById("patternInput");

  if (!drumGrid) {
    console.error("Missing essential DOM elements");
    return;
  }

  createGrid(storageKey);

  const savedPattern = localStorage.getItem(storageKey);
  if (savedPattern) {
    try {
      loadPatternFromText(savedPattern);
    } catch (e) {
      console.warn("Invalid saved pattern:", e.message);
    }
  }

  updateGridUI();
  void loadSamples();

  (async () => {
    const correctPattern = await getDailyPattern();
    maxActiveSteps = correctPattern.split("").filter((c) => c === "x").length;
    updateStepCounter();
  })();

  const playBtn = document.getElementById("playBtn");
  if (playBtn) {
    playBtn.addEventListener("click", async () => {
      if (isPlaying) return;

      isPlaying = true;
      playBtn.disabled = true;

      try {
        await playPatternArray(pattern, { includeMetronome: false });
      } finally {
        isPlaying = false;
        setTimeout(() => {
          isPlaying = false;
          playBtn.disabled = false;
        }, 2000);
      }
    });
  }

  const loadBtn = document.getElementById("loadBtn");
  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      try {
        loadPatternFromText(patternInput.value);
        updateGridUI();
        patternInput.value = "";
        document.getElementById("patternLoaderModal").style.display = "none";
        savePatternToLocalStorage(storageKey);
      } catch (e) {
        console.warn(e.message);
        patternInput.classList.add("error");
      }
    });
  }

  if (patternInput) {
    patternInput.addEventListener("input", () => {
      patternInput.classList.remove("error");
    });
  }

  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const copyText = patternToText(pattern);
      navigator.clipboard.writeText(copyText);
    });
  }

  document.getElementById("clearBtn").addEventListener("click", () => {
    for (let lane = 0; lane < LANES; lane++) {
      for (let step = 0; step < STEPS_PER_LANE; step++) {
        pattern[lane][step] = false;
      }
    }
    updateGridUI();
    savePatternToLocalStorage(storageKey);
  });

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      if (!canAttempt()) {
        alert("You've used all your attempts today!");
        return;
      }
      const userPattern = patternToText(pattern);
      const activeCount = userPattern.split("").filter((c) => c === "x").length;
      if (activeCount > maxActiveSteps) {
        alert(`Too many active steps. Max allowed: ${maxActiveSteps}`);
        return;
      }
      const correctPattern = await getDailyPattern();
      saveAttempt(userPattern, correctPattern);
    });
  }

  function canAttempt() {
    const dateKey = getTodayDateString();
    const dataKey = `${dateKey}_botd_data`;
    const data = JSON.parse(localStorage.getItem(dataKey) || "[]");
    return data.length < 6;
  }

  function comparePatterns(user, correct) {
    const userLines = user.trim().split("\n");
    const correctLines = correct.trim().split("\n");

    const result = [];

    for (let i = 0; i < correctLines.length; i++) {
      for (let j = 0; j < correctLines[i].length; j++) {
        const correctChar = correctLines[i][j];
        const userChar = userLines[i]?.[j] || "-";

        if (userChar === "x") {
          result.push(correctChar === "x");
        } else {
          result.push(null);
        }
      }
    }

    return result;
  }

  function saveAttempt(userPattern, correctPattern) {
    const dateKey = getTodayDateString();
    const dataKey = dateKey + "_botd_data";

    // Remove any _botd_data entries for other dates
    Object.keys(localStorage).forEach((key) => {
      if (key.endsWith("_botd_data") && key !== dataKey) {
        localStorage.removeItem(key);
      }
    });

    const data = JSON.parse(localStorage.getItem(dataKey) || "[]");
    const comparison = comparePatterns(userPattern, correctPattern);

    const correctCount = comparison.filter((x) => x === true).length;
    const totalChecked = correctPattern
      .split("")
      .filter((c) => c === "x").length;

    data.push({
      pattern: userPattern,
      timestamp: new Date().toISOString(),
      comparison,
      correctCount,
      totalChecked,
    });

    localStorage.setItem(dataKey, JSON.stringify(data));
    renderTodaySubmissions(storageKey);
  }

  const listenBtn = document.getElementById("listenBtn");
  if (listenBtn) {
    listenBtn.addEventListener("click", async () => {
      if (isPlaying) return;

      isPlaying = true;
      listenBtn.disabled = true;

      try {
        const patternText = await getDailyPattern();
        const tempPattern = parsePatternTextToArray(patternText);
        await playPatternArray(tempPattern, { includeMetronome: true });
      } catch (err) {
        console.error("Failed to load or play daily pattern:", err);
      } finally {
        setTimeout(() => {
          isPlaying = false;
          listenBtn.disabled = false;
        }, 3500);
      }
    });
  }
}

function renderTodaySubmissions(storageKey) {
  const replayDrumGrid = document.getElementById("replayDrumGrid");
  replayDrumGrid.innerHTML = "";

  const dateKey = getTodayDateString();
  const dataKey = `${dateKey}_botd_data`;
  const data = JSON.parse(localStorage.getItem(dataKey) || "[]").reverse();

  if (data.length === 0) return;

  data.forEach((entry, index) => {
    const patternGrid = parsePatternTextToArray(entry.pattern);
    const { comparison } = entry;

    const wrapper = document.createElement("div");
    wrapper.classList.add("replay-attempt");

    const title = document.createElement("div");
    title.classList.add("svg-icon");
    title.classList.add("accordion");

    title.innerHTML = `
      <div class="accordion-inner">
        <span class="icon-left">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
            ${GenerateSVG(data.length - index)}
          </svg>
          <span class="text">(${entry.correctCount} / ${
      entry.totalChecked
    })</span>
        </span>
        <span class="icon-toggle">
          <svg
            class="plus"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
            <path d="M9 12h6" />
            <path d="M12 9v6" />
          </svg>

          <svg
            class="minus"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
            <path d="M9 12l6 0" />
          </svg>
        </span>
      </div>
    `;

    const panel = document.createElement("div");
    panel.className = "panel";

    // Button controls
    const buttonGrid = document.createElement("div");
    buttonGrid.className = "button-grid";

    const replayButton = replayReplayButton(patternGrid);
    const loadButton = replayLoadButton(storageKey, entry.pattern);

    buttonGrid.appendChild(replayButton);
    buttonGrid.appendChild(loadButton);

    // Grid wrapper
    const gridWrapper = document.createElement("div");
    gridWrapper.classList.add("grid-wrapper");

    const grid = document.createElement("div");
    grid.classList.add("grid");

    for (let lane = 0; lane < LANES; lane++) {
      const row = document.createElement("div");
      row.classList.add("lane-row");

      const label = document.createElement("div");
      label.classList.add("lane-label");
      label.textContent = laneLabels[lane] || `Lane ${lane + 1}`;
      row.appendChild(label);

      for (let step = 0; step < STEPS_PER_LANE; step++) {
        const stepDiv = document.createElement("div");
        stepDiv.classList.add("step");

        if (patternGrid[lane][step]) {
          const flatIndex = lane * STEPS_PER_LANE + step;
          if (comparison[flatIndex] === true) stepDiv.classList.add("correct");
          else if (comparison[flatIndex] === false)
            stepDiv.classList.add("incorrect");
        }

        row.appendChild(stepDiv);
      }

      grid.appendChild(row);
    }

    gridWrapper.appendChild(grid);
    panel.appendChild(buttonGrid);
    panel.appendChild(gridWrapper);

    wrapper.appendChild(title);
    wrapper.appendChild(panel);
    replayDrumGrid.appendChild(wrapper);
  });

  const acc = document.getElementsByClassName("accordion");

  for (let i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function () {
      for (let j = 0; j < acc.length; j++) {
        if (acc[j] !== this) {
          acc[j].classList.remove("active-accordion");
          const otherPanel = acc[j].nextElementSibling;
          otherPanel.style.maxHeight = null;
        }
      }

      const panel = this.nextElementSibling;
      const isActive = this.classList.contains("active-accordion");

      if (isActive) {
        this.classList.remove("active-accordion");
        panel.style.maxHeight = null;
      } else {
        this.classList.add("active-accordion");
        panel.style.maxHeight = panel.scrollHeight + "px";

        const container = this.closest(".replay-attempt");
        const y = container.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  }

  // Open the first accordion by default
  if (acc.length > 0) {
    acc[0].classList.add("active-accordion");
    const firstPanel = acc[0].nextElementSibling;
    firstPanel.style.maxHeight = firstPanel.scrollHeight + "px";

    const container = acc[0].closest(".replay-attempt");
    const y = container.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

window.initDrumGrid = initDrumGrid;
window.renderTodaySubmissions = renderTodaySubmissions;

function replayReplayButton(patternGrid) {
  const buttonItem = document.createElement("div");
  buttonItem.className = "button-item";

  const replayButton = document.createElement("button");
  replayButton.className = "btn svg-icon";
  replayButton.innerHTML = `
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M7 4v16l13 -8z" />
      </svg>
  `;

  const buttonText = document.createElement("div");
  buttonText.className = "button-text";
  buttonText.textContent = "Replay";

  buttonItem.appendChild(replayButton);
  buttonItem.appendChild(buttonText);

  replayButton.addEventListener("click", async () => {
    if (isPlaying) return;

    isPlaying = true;
    replayButton.disabled = true;

    try {
      await playPatternArray(patternGrid, { includeMetronome: true });
    } finally {
      setTimeout(() => {
        isPlaying = false;
        replayButton.disabled = false;
      }, 3500);
    }
  });

  return buttonItem;
}

function replayLoadButton(storageKey, textPattern) {
  const buttonItem = document.createElement("div");
  buttonItem.className = "button-item";

  const loadButton = document.createElement("button");
  loadButton.className = "btn svg-icon";
  loadButton.innerHTML = `
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
        <path d="M7 9l5 -5l5 5" />
        <path d="M12 4l0 12" />
      </svg>
  `;

  const buttonText = document.createElement("div");
  buttonText.className = "button-text";
  buttonText.textContent = "Load";

  buttonItem.appendChild(loadButton);
  buttonItem.appendChild(buttonText);

  loadButton.addEventListener("click", async () => {
    try {
      loadPatternFromText(textPattern);
      updateGridUI();
      savePatternToLocalStorage(storageKey);
    } catch (e) {
      console.warn(e.message);
    }
  });

  return buttonItem;
}

function GenerateSVG(num) {
  switch (num) {
    case 1:
      return `<path d="M10 10l2 -2v8" />`;
    case 2:
      return `<path d="M10 8h3a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 0 -1 1v2a1 1 0 0 0 1 1h3" />`;
    case 3:
      return `<path d="M10 9a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1" />`;
    case 4:
      return `<path d="M10 8v3a1 1 0 0 0 1 1h3" /> <path d="M14 8v8" />`;
    case 5:
      return `<path d="M10 15a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1v-2a1 1 0 0 0 -1 -1h-3v-4h4" />`;
    case 6:
      return `<path d="M14 9a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1v-2a1 1 0 0 0 -1 -1h-3" />`;
    default:
      return "";
  }
}

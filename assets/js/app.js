const LANES = 8;
const STEPS_PER_LANE = 16;

const pattern = Array.from({ length: LANES }, () =>
  new Array(STEPS_PER_LANE).fill(false)
);

const instrumentFiles = [
  "sounds/crash.wav",
  "sounds/hhat.wav",
  "sounds/ride.wav",
  "sounds/htom.wav",
  "sounds/mtom.wav",
  "sounds/snare.wav",
  "sounds/ftom.wav",
  "sounds/kick.wav",
];

const buffers = new Array(LANES).fill(null);

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let drumGrid, patternInput;

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
function savePatternToLocalStorage() {
  const textPattern = patternToText();
  localStorage.setItem("playgroundPattern", textPattern);
}

// Audio handling
async function loadSamples() {
  for (let i = 0; i < LANES; i++) {
    const response = await fetch(instrumentFiles[i]);
    const arrayBuffer = await response.arrayBuffer();
    buffers[i] = await audioCtx.decodeAudioData(arrayBuffer);
  }
}

function playInstrument(time, lane) {
  if (!buffers[lane]) return;
  const source = audioCtx.createBufferSource();
  source.buffer = buffers[lane];
  source.connect(audioCtx.destination);
  source.start(time);
}

async function playPattern() {
  await loadSamples();
  const startTime = audioCtx.currentTime;

  for (let step = 0; step < STEPS_PER_LANE; step++) {
    const hitTime = startTime + step * 0.11;

    for (let lane = 0; lane < LANES; lane++) {
      if (pattern[lane][step]) {
        playInstrument(hitTime, lane);
      }
    }
  }
}

function createGrid() {
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

  const labelStates = new Array(LANES).fill(0);

  for (let lane = 0; lane < LANES; lane++) {
    const row = document.createElement("div");
    row.classList.add("lane-row");

    // Lane label
    const label = document.createElement("div");
    label.classList.add("lane-label");
    label.textContent = laneLabels[lane] || `Lane ${lane + 1}`;
    row.appendChild(label);

    label.addEventListener("click", () => {
      const newState = labelStates[lane] === 1 ? false : true;
      labelStates[lane] = newState ? 1 : 0;

      for (let step = 0; step < STEPS_PER_LANE; step++) {
        pattern[lane][step] = newState;
      }

      updateGridUI();
      savePatternToLocalStorage();
    });

    // Steps
    for (let step = 0; step < STEPS_PER_LANE; step++) {
      const stepDiv = document.createElement("div");
      stepDiv.classList.add("step");

      stepDiv.addEventListener("click", () => {
        pattern[lane][step] = !pattern[lane][step];
        stepDiv.classList.toggle("active");
        savePatternToLocalStorage();
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
}

function initDrumGrid() {
  drumGrid = document.getElementById("drumGrid");
  patternInput = document.getElementById("patternInput");

  if (!drumGrid || !patternInput) {
    console.error("Missing essential DOM elements");
    return;
  }

  createGrid();

  const playgroundPattern = localStorage.getItem("playgroundPattern");
  if (playgroundPattern) {
    try {
      loadPatternFromText(playgroundPattern);
    } catch (e) {
      console.warn("Invalid saved pattern:", e.message);
    }
  }

  updateGridUI();

  document.getElementById("playBtn").addEventListener("click", async () => {
    const playBtn = document.getElementById("playBtn");
    playBtn.disabled = true;
    await playPattern();
    setTimeout(() => {
      playBtn.disabled = false;
    }, 2500);
  });

  document.getElementById("loadBtn").addEventListener("click", () => {
    try {
      loadPatternFromText(patternInput.value);
      updateGridUI();
      patternInput.value = "";

      document.getElementById("patternLoaderModal").style.display = "none";

      savePatternToLocalStorage();
    } catch (e) {
      console.warn(e.message);
      patternInput.classList.add("error");
    }
  });

  patternInput.addEventListener("input", () => {
    patternInput.classList.remove("error");
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    const copyText = patternToText();
    navigator.clipboard.writeText(copyText);
  });

  document.getElementById("clearBtn").addEventListener("click", () => {
    for (let lane = 0; lane < LANES; lane++) {
      for (let step = 0; step < STEPS_PER_LANE; step++) {
        pattern[lane][step] = false;
      }
    }
    updateGridUI();

    savePatternToLocalStorage();
  });
}

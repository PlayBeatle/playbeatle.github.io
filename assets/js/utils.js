function loadHTML(id, file, callback) {
  fetch(file)
    .then((res) => res.text())
    .then((data) => {
      document.getElementById(id).innerHTML = data;
      if (callback) callback();
    });
}

function applyTheme(theme) {
  // Theme
  const themeStylesheet = document.getElementById("themeStylesheet");
  const logo = document.getElementById("logo");

  themeStylesheet.href = `assets/css/${theme}.css`;
  if (logo) {
    logo.src = `assets/images/logos/${
      theme === "dark" ? "b-logo.svg" : "w-logo.svg"
    }`;
  }

  const beatleLogo = document.getElementById("beatle-logo");
  if (beatleLogo) {
    beatleLogo.src = `assets/images/logos/beatle-${
      theme === "dark" ? "b" : "w"
    }-logo.svg`;
  }

  localStorage.setItem("theme", theme);
}

window.applyTheme = applyTheme;

function initHeaderBehavior() {
  // Sidebar
  const sidebar = document.getElementById("sidebar");
  const openBtn = document.querySelector(".openbtn");
  const closeBtn = document.getElementById("closeSidebar");
  const volumeBtn = document.getElementById("volumeCycleButton");

  const toggleSidebar = () => sidebar.classList.toggle("active");
  const closeSidebar = () => sidebar.classList.remove("active");

  closeBtn.addEventListener("click", toggleSidebar);
  openBtn.addEventListener("click", toggleSidebar);

  volumeBtn.addEventListener("click", () => {
    const volIndex = window.audioAPI.cycleVolumeLevel() ?? 2;
    setVolumeSVG(volIndex, volumeBtn);
  });

  const savedVolume = Number(localStorage.getItem("volume"));
  const volIndexOnLoad = isNaN(savedVolume) ? 2 : savedVolume;
  setVolumeSVG(volIndexOnLoad, volumeBtn);

  document.addEventListener("click", (event) => {
    if (
      sidebar &&
      !sidebar.contains(event.target) &&
      !openBtn.contains(event.target)
    ) {
      closeSidebar();
    }
  });

  const getCurrentTheme = () => localStorage.getItem("theme") || "dark";
  applyTheme(getCurrentTheme());

  // Toggle theme
  document.getElementById("themeToggle").addEventListener("click", () => {
    const themeStylesheet = document.getElementById("themeStylesheet");
    const currentHref = themeStylesheet.href;
    const newTheme = currentHref.includes("dark") ? "light" : "dark";
    applyTheme(newTheme);
  });
}

function setVolumeSVG(index, volumeBtn) {
  switch (index) {
    case 0:
      volumeBtn.innerHTML = `  
<svg
  xmlns="http://www.w3.org/2000/svg"

  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
</svg>
`;
      break;
    case 1:
      volumeBtn.innerHTML = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M15 8a5 5 0 0 1 0 8" />
  <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
</svg>
`;
      break;
    case 2:
    default:
      volumeBtn.innerHTML = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M15 8a5 5 0 0 1 0 8" />
  <path d="M17.7 5a9 9 0 0 1 0 14" />
  <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
</svg>
`;
      break;
  }
}

function animateBeatleBoxes() {
  const boxes = document.querySelectorAll(".beatle-box");
  if (!boxes.length) return;

  const color = "#72E582";
  const intervalTime = 200;
  const pauseTime = 2500;
  let direction = 1;

  const resetBox = (box) => {
    box.style.backgroundColor = "";
    box.style.color = "";
    const svg = box.querySelector("img, svg");
    if (svg) svg.style.filter = "";
  };

  const highlightBox = (box) => {
    box.style.backgroundColor = color;
    box.style.color = "black";
    const svg = box.querySelector("img, svg");
    if (svg) svg.style.filter = "brightness(0)";
  };

  const runAnimation = () => {
    boxes.forEach(resetBox);

    let step = 0;
    const interval = setInterval(() => {
      if (step < boxes.length) {
        const box = boxes[step];
        direction === 1 ? highlightBox(box) : resetBox(box);
        step++;
      } else {
        clearInterval(interval);
        direction *= -1;
        setTimeout(runAnimation, pauseTime);
      }
    }, intervalTime);
  };

  runAnimation();
}

function getStorageKey(suffix = "Pattern", fallback = "playground") {
  const fileBaseName =
    window.location.pathname.split("/").pop().replace(".html", "") || fallback;
  return `${fileBaseName}${suffix}`;
}

const cachedPatternsByDate = {};

async function getDailyPattern() {
  const todayUTC = new Date();
  const utcDateStr = todayUTC.toISOString().slice(0, 10);

  if (cachedPatternsByDate[utcDateStr]) {
    return cachedPatternsByDate[utcDateStr];
  }

  const partIds = getDailyNumberCode(utcDateStr).trim().split(" ").map(Number);
  const partFiles = partIds.map((id) => `assets/rhythms/beats/${id}.txt`);

  const parts = await Promise.all(
    partFiles.map((path) => fetch(path).then((res) => res.text()))
  );

  const combined = Array.from({ length: 8 }, () => "");

  for (const text of parts) {
    const lines = text.trim().split("\n");

    if (lines.length !== 8) {
      throw new Error(`Expected 8 lines, got ${lines.length}`);
    }

    lines.forEach((raw, i) => {
      const line = raw.trim();
      if (line.length !== 4) {
        throw new Error(`Line ${i + 1} in part is not 4 characters: "${line}"`);
      }
      combined[i] += line;
    });
  }

  combined.forEach((line, i) => {
    if (line.length !== 16) {
      throw new Error(`Lane ${i + 1} does not have 16 steps`);
    }
  });

  const pattern = combined.join("\n");
  cachedPatternsByDate[utcDateStr] = pattern;
  return pattern;
}

function getDailyNumberCode(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);

  const seed = year * 10000 + month * 100 + day;

  function seededRandom(s) {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  }

  const NUM_BEATS = 9;

  let code = "";
  for (let i = 0; i < 4; i++) {
    const rand = seededRandom(seed + i);
    const digit = Math.floor(rand * NUM_BEATS) + 1;
    code += digit + " ";
  }

  return code.trim();
}

function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function showToast(message, duration = 4000) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.classList.add("toast");
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.justifyContent = "space-between";
  toast.style.gap = "10px";
  toast.style.cursor = "pointer";

  const text = document.createElement("span");
  text.textContent = message;
  text.style.flex = "1";

  const closeBtn = document.createElement("span");
  closeBtn.innerHTML = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="20"
  height="20"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <circle cx="12" cy="12" r="9" />
  <line x1="10" y1="10" x2="14" y2="14" />
  <line x1="14" y1="10" x2="10" y2="14" />
</svg>
`;
  closeBtn.style.display = "flex";
  closeBtn.style.alignItems = "center";

  const removeToast = () => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove());
  };

  toast.addEventListener("click", removeToast);
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    removeToast();
  });

  toast.appendChild(text);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    if (toast.parentNode) removeToast();
  }, duration);
}

function loadHTML(id, file, callback) {
  fetch(file)
    .then((res) => res.text())
    .then((data) => {
      document.getElementById(id).innerHTML = data;
      if (callback) callback();
    });
}

function initHeaderBehavior() {
  // Sidebar
  const sidebar = document.getElementById("sidebar");
  const openBtn = document.querySelector(".openbtn");
  const closeBtn = document.getElementById("closeSidebar");

  const toggleSidebar = () => sidebar.classList.toggle("active");
  const closeSidebar = () => sidebar.classList.remove("active");

  closeBtn.addEventListener("click", toggleSidebar);
  openBtn.addEventListener("click", toggleSidebar);

  document.addEventListener("click", (event) => {
    if (
      sidebar &&
      !sidebar.contains(event.target) &&
      !openBtn.contains(event.target)
    ) {
      closeSidebar();
    }
  });

  // Theme
  const themeStylesheet = document.getElementById("themeStylesheet");
  const logo = document.getElementById("logo");

  const applyTheme = (theme) => {
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
  };

  const getCurrentTheme = () => localStorage.getItem("theme") || "dark";

  // Initialize theme on load
  applyTheme(getCurrentTheme());

  // Toggle theme
  document.getElementById("themeToggle").addEventListener("click", () => {
    const currentHref = themeStylesheet.href;
    const newTheme = currentHref.includes("dark") ? "light" : "dark";
    applyTheme(newTheme);
  });
}
  
function parseRhythmRow(str, stepsPerLane) {
  return Array.from(str)
    .map((char) => char === "x")
    .slice(0, stepsPerLane);
}

function patternToText() {
  return pattern
    .map((row) => row.map((cell) => (cell ? "x" : "-")).join(""))
    .join("\n");
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
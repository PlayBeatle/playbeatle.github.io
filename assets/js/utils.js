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
    logo.src = `assets/images/logos/${
      theme === "dark" ? "b-logo.svg" : "w-logo.svg"
    }`;
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
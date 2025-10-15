function showFinishedModal() {
  const attemptData = JSON.parse(
    localStorage.getItem(`${getTodayDateString()}_botd_data`) || "[]"
  );
  const won = attemptData.some(
    (a) => a.correctCount === a.totalChecked && a.totalChecked > 0
  );
  const attemptsUsed = attemptData.length;

  loadHTML("modalContainer", "partials/finished-modal.html", () => {
    const p = document.querySelector("#finishedModal p");
    const h4 = document.querySelector("#finishedModal h4");

    if (!won) {
      p.textContent = "Unlucky! Better luck tomorrow!";
    } else {
      switch (attemptsUsed) {
        case 1:
          p.textContent = "Perfect! First try!";
          break;
        case 2:
          p.textContent = "Great job! Two tries!";
          break;
        case 3:
          p.textContent = "Three's a charm!";
          break;
        case 4:
        case 5:
          p.textContent = "Phew, you got it!";
          break;
        case 6:
          p.textContent = "Finally! You made it!";
          break;
        default:
          p.textContent = "Well done!";
      }
    }

    function updateCountdown() {
      const now = new Date();
      const nextUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
      );

      const diff = nextUTC - now;

      const hours = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(
        2,
        "0"
      );
      const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(
        2,
        "0"
      );

      h4.textContent = `Next Beatle in ${hours}:${minutes}:${seconds}`;

      // Stop interval when countdown hits 00:00:00
      if (hours === "00" && minutes === "00" && seconds === "00") {
        clearInterval(countdownInterval);
      }
    }

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);

    initModalBehavior("finishedModal");

    window.applyTheme(localStorage.getItem("theme") || "dark");

    const modal = document.getElementById("finishedModal");
    modal.addEventListener("hide", () => clearInterval(countdownInterval));
  });
}

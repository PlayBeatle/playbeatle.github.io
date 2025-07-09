function initModalBehavior() {
  const modal = document.getElementById("patternLoaderModal");
  const openBtn = document.getElementById("openModal");
  const closeBtns = document.querySelectorAll("#closeModal");

  const patternInput = document.getElementById("patternInput");

  const openModal = () => {
    modal.style.display = "block";
    patternInput.focus();
  };

  const closeModal = () => {
    modal.style.display = "none";
  };

  openBtn.addEventListener("click", openModal);
  closeBtns.forEach((btn) => btn.addEventListener("click", closeModal));

  window.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
}

window.initModalBehavior = initModalBehavior;

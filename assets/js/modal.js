function initModalBehavior(modalId, openBtnId = null, closeBtnSelector = "#closeModal") {
  const modal = document.getElementById(modalId);
  const openBtn = openBtnId ? document.getElementById(openBtnId) : null;
  const closeBtns = modal.querySelectorAll(closeBtnSelector);

  if (!modal) return;

  const openModal = () => {
    modal.style.display = "block";
    const input = modal.querySelector("input");
    if (input) input.focus();
  };

  const closeModal = () => {
    modal.style.display = "none";
  };

  if (openBtn) {
    openBtn.addEventListener("click", openModal);
  } else {
    openModal();
  }

  closeBtns.forEach((btn) => btn.addEventListener("click", closeModal));

  window.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
}

window.initModalBehavior = initModalBehavior;

export const showPopUpMessage = (message) => {
  const existing = document.getElementById("pop-up-message");
  if (existing) existing.remove();

  const popUp = document.createElement("div");
  popUp.className = "pop-up-message";
  popUp.textContent = message;
  document.body.appendChild(popUp);
  requestAnimationFrame(() => {
    popUp.style.opacity = "1";
  });
  setTimeout(() => {
    popUp.style.opacity = "0";
    setTimeout(() => popUp.remove(), 200);
  }, 2000);
};

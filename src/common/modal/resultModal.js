const resultModal = document.getElementById("resultModal");
const resultTitle = resultModal.querySelector(".result-title");
const resultInfo = resultModal.querySelector(".result-info");
const resultBtn = resultModal.querySelector(".result-btn");

export const showResultModal = ({ type, winnings, rolledSum, betName }) => {
  resultModal.classList.remove("win", "lose");
  resultModal.classList.add(type, "show");

  if (type === "win") {
    resultTitle.textContent = "🎉 YOU WIN! 🎉";
    resultInfo.textContent = `You won £${winnings.toFixed(2)}`;
    resultBtn.textContent = "Play Again";
  }

  if (type === "lose") {
    resultTitle.textContent = "You Lose!";
    resultInfo.textContent = `Rolled ${rolledSum} — bet was on ${betName}`;
    resultBtn.textContent = "Try Again";
  }

  resultBtn.onclick = () => {
    resultModal.classList.remove("show");
  };
};

import { showPopUpMessage } from "../../common/popUpMessage";
import { useUpdateBalance } from "../balance";

export const useBetPanel = ({
  rollDice,
  gameState,
  diceBody,
  diceBody2
}) => {
  const betAmountInput = document.getElementById("betAmount");
  const faceContainers = document.querySelectorAll(".faceContainer");

  faceContainers.forEach((container) => {
    const btn = container.querySelector(".faceBtn");

    btn.onclick = () => {
      if (gameState.betPlaced || gameState.diceRolling) {
        showPopUpMessage("Dice are rolling! Wait for results.");
        return;
      }
      const { balanceElement, currentBalance } = useUpdateBalance();
      const amount = Number(betAmountInput.value);

      if (amount > currentBalance) {
        showPopUpMessage("Insufficient balance!");
        return;
      }

      gameState.selectedFace = container.dataset.sums.split(",").map(Number);
      gameState.betPlaced = true;
      gameState.betAmount = amount;

      const newBalance = currentBalance - amount;
      balanceElement.textContent = "Balance: " + newBalance.toFixed(2);

      gameState.diceRolling = true;
      gameState.resultsChecked = false;
      gameState.settleTime = 0;

      rollDice(diceBody);
      rollDice(diceBody2);
    };
  });
};

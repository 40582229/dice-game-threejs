export const useUpdateStake = () => {
  const minus = document.querySelector(".minus");
  const plus = document.querySelector(".plus");

  minus.onclick = () => {
    const input = document.querySelector(".bet-amount");
    const value = Number(input.value);
    if (value - 1 === 0) {
      return;
    }
    input.value = value - 1;
  };

  plus.onclick = () => {
    const input = document.querySelector(".bet-amount");
    const value = Number(input.value);
    input.value = value + 1;
  };
};

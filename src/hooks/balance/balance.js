export const useUpdateBalance = () => {
  const balanceElement = document.getElementById("balance");
  const indexOfSeparator = balanceElement.textContent.indexOf(":");
  const currentBalance = Number(
    balanceElement.textContent.slice(indexOfSeparator + 1).trim(),
  );

  return { balanceElement, currentBalance };
};

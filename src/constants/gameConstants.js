export const faceValues = [1, 6, 2, 5, 3, 4]; // +X, -X, +Y, -Y, +Z, -Z

// Ways to roll each sum with two dice (out of 36)
export const waysToRoll = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};

// Pair-based betting with probability-adjusted multipliers
export const bettingPairs = [
  { name: "2 or 12", sums: [2, 12], multiplier: 9.0 }, // 5.56%
  { name: "3 or 11", sums: [3, 11], multiplier: 4.5 }, // 11.11%
  { name: "4 or 10", sums: [4, 10], multiplier: 3.0 }, // 16.67%
  { name: "5 or 9", sums: [5, 9], multiplier: 2.25 }, // 22.22%
  { name: "6, 7, 8", sums: [6, 7, 8], multiplier: 1.25 }, // 44.44%
];
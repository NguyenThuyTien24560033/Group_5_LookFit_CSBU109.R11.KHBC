const colorGroups = {
  white: "neutral",
  black: "neutral",
  gray: "neutral",
  beige: "neutral",
  brown: "neutral",
  navy: "cool",
  red: "warm",
  orange: "warm",
  yellow: "warm",
  pink: "warm",
  blue: "cool",
  green: "cool",
  purple: "cool",
};

const colorWheel = {
  red: 0,
  orange: 30,
  yellow: 60,
  green: 120,
  blue: 210,
  purple: 270,
  pink: 330,
};

function getColorWheelDistance(colorA, colorB) {
  if (
    colorWheel[colorA] === undefined ||
    colorWheel[colorB] === undefined
  ) {
    return null;
  }

  const difference = Math.abs(colorWheel[colorA] - colorWheel[colorB]);

  return Math.min(difference, 360 - difference);
}

export function calculateColorHarmony(colorA, colorB) {
  if (!colorA || !colorB) return 0;

  if (colorA === colorB) return 2;

  const groupA = colorGroups[colorA];
  const groupB = colorGroups[colorB];

  if (groupA === "neutral" || groupB === "neutral") {
    return 2;
  }

  const distance = getColorWheelDistance(colorA, colorB);

  if (distance === null) return 0;

  if (distance <= 60) return 2;

  if (distance >= 150 && distance <= 210) return 2;

  return 1;
}

export function calculateColorCompatibility(itemColor, favoriteColors) {
  if (!itemColor) return 0;

  if (!Array.isArray(favoriteColors) || favoriteColors.length === 0) {
    return 1;
  }

  if (favoriteColors.includes(itemColor)) return 2;

  return Math.max(
    ...favoriteColors.map((color) =>
      calculateColorHarmony(itemColor, color)
    )
  );
}

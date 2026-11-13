export function calculateCaseCompatibility(itemCases, userCase) {
  if (!Array.isArray(itemCases) || !userCase) return 0;
  return itemCases.includes(userCase) ? 1 : 0;
}

export function calculateStyleCompatibility(itemStyles, userStyle) {
  if (!Array.isArray(itemStyles) || !userStyle) return 0;
  return itemStyles.includes(userStyle) ? 1 : 0;
}

export function calculateSeasonCompatibility(itemSeasons, userSeason) {
  if (!Array.isArray(itemSeasons) || !userSeason) return 0;
  return itemSeasons.includes(userSeason) ? 1 : 0;
}

export function calculateWeatherCompatibility(itemWeathers, userWeather) {
  if (!Array.isArray(itemWeathers) || !userWeather) return 0;
  return itemWeathers.includes(userWeather) ? 1 : 0;
}

export function calculateLifestyleCompatibility(itemLifestyles, userLifestyle) {
  if (!Array.isArray(itemLifestyles) || !userLifestyle) return 0;
  return itemLifestyles.includes(userLifestyle) ? 1 : 0;
}

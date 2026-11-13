export function calculateBodyShape({ bust, waist, hip }) {
  const bustHipDiff = Math.abs(bust - hip);
  const bustWaistDiff = bust - waist;
  const hipWaistDiff = hip - waist;

  if (
    bustHipDiff <= 5 &&
    bustWaistDiff >= 18 &&
    hipWaistDiff >= 18
  ) {
    return "hourglass";
  }

  if (hip - bust >= 5) {
    return "pear";
  }

  if (bust - hip >= 5) {
    return "inverted-triangle";
  }

  if (
    bustHipDiff <= 5 &&
    bustWaistDiff < 18 &&
    hipWaistDiff < 18
  ) {
    return "rectangle";
  }

  return "apple";
}

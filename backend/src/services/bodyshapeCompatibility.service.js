export function calculateBodyShapeCompatibility(itemShapes, bodyShape) {
  if (!Array.isArray(itemShapes) || !bodyShape) {
    return 0;
  }

  return itemShapes.includes(bodyShape) ? 5 : 0;
}

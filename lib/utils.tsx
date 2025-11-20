export function generateRegNumber(): string {
  const num = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
  return `NG/GRA/${num}${letter}`;
}

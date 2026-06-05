// Utility helper functions
export function generateId(len = 6) {
  return Math.random().toString(36).substring(2, 2 + len).toUpperCase();
}

export function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

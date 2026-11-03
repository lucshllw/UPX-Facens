export const LIMIT = 8 * Math.PI / 180;
export const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export const approach = (value, target, dt, rate = 7) => value + (target - value) * (1 - Math.exp(-rate * dt));
export function nextObject(current, count, random = Math.random) {
  if (count < 2) return current;
  const pick = Math.min(count - 2, Math.floor(clamp(random(), 0, 1) * (count - 1)));
  return pick >= current ? pick + 1 : pick;
}
export function pointerTilt(x, y, rect) {
  return {x:clamp((y - rect.top) / rect.height * 2 - 1, -1, 1) * LIMIT * .65,
    y:clamp((x - rect.left) / rect.width * 2 - 1, -1, 1) * LIMIT};
}
export function dragIntent(dx, dy) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return 'pending';
  return Math.abs(dx) > Math.abs(dy) * 1.15 ? 'horizontal' : 'vertical';
}
export const dragRotation = (start, dx, width) => start + dx / Math.max(width, 1) * Math.PI * 1.8;
export const smoothStep = value => {const t=clamp(value,0,1);return t*t*(3-2*t);};

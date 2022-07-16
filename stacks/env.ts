import invariant from "tiny-invariant";

export function get(key: string) {
  const value = process.env[key];
  invariant(value, `process.env.${key}`);
  return value;
}

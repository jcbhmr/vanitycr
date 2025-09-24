export default function once<T>(fn: () => T): () => T {
  let state: "pending" | "fulfilled" | "rejected" = "pending";
  let result: T | unknown;
  return () => {
    if (state === "pending") {
      try {
        result = fn();
        state = "fulfilled";
      } catch (error) {
        result = error;
        state = "rejected";
      }
    }
    if (state === "fulfilled") {
      return result as T;
    } else {
      throw result;
    }
  };
}

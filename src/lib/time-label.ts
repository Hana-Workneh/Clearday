/** Keep calculated time units grammatical, including zero and fractional counts. */
export function timeLabel(count: number | string, unit: "month" | "day" | "year") {
  return `${count} ${Number(count) === 1 ? unit : `${unit}s`}`;
}

/** AI templates may supply plural units before checked numbers are inserted. */
export function correctTimeUnits(text: string) {
  return text.replace(
    /\b(\d+(?:\.\d+)?)\s+(months?|days?|years?)\b/g,
    (_match, count: string, unit: string) =>
      timeLabel(count, unit.replace(/s$/, "") as "month" | "day" | "year"),
  );
}

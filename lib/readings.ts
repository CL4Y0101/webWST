export type Condition = "NORMAL" | "WARNING" | "CRITICAL";

export type Reading = {
  id: string;
  temperature: number;
  humidity: number;
  status: Condition;
  timestamp: number;
};

// Nilai ini hanya untuk simulasi prototype, bukan standar penyimpanan tuna.
export const PROTOTYPE_LIMITS = {
  temperature: { warning: 6, critical: 8 },
  humidity: { warning: 76, critical: 85 },
} as const;

export function conditionFor(temperature: number, humidity: number): Condition {
  if (temperature >= PROTOTYPE_LIMITS.temperature.critical || humidity >= PROTOTYPE_LIMITS.humidity.critical) return "CRITICAL";
  if (temperature >= PROTOTYPE_LIMITS.temperature.warning || humidity >= PROTOTYPE_LIMITS.humidity.warning) return "WARNING";
  return "NORMAL";
}

function parseTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value < 1e11 ? value * 1000 : value;
  if (typeof value === "string") {
    const numeric = Number(value);
    if (value.trim() && Number.isFinite(numeric)) return numeric < 1e11 ? numeric * 1000 : numeric;
    const date = Date.parse(value.replace(" ", "T"));
    return Number.isNaN(date) ? null : date;
  }
  return null;
}

export function normalizeReadings(value: unknown): Reading[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([id, raw]) => {
    if (!raw || typeof raw !== "object") return [];
    const row = raw as Record<string, unknown>;
    if (row.temperature === null || row.temperature === undefined || row.temperature === "" || row.humidity === null || row.humidity === undefined || row.humidity === "") return [];
    const temperature = Number(row.temperature);
    const humidity = Number(row.humidity);
    const timestamp = parseTimestamp(row.timestamp);
    if (!Number.isFinite(temperature) || !Number.isFinite(humidity) || timestamp === null) return [];
    const supplied = String(row.status ?? "").toUpperCase();
    const status: Condition = supplied === "NORMAL" || supplied === "WARNING" || supplied === "CRITICAL"
      ? supplied
      : conditionFor(temperature, humidity);
    return [{ id, temperature, humidity, timestamp, status }];
  }).sort((a, b) => a.timestamp - b.timestamp).slice(-100);
}

export function demoSeed(now: number): Reading[] {
  return Array.from({ length: 28 }, (_, index) => {
    const temperature = Number((5.1 + Math.sin(index * 0.42) * 0.48 + index * 0.008).toFixed(1));
    const humidity = Math.round(69 + Math.sin(index * 0.36 + 1.2) * 3);
    return {
      id: `demo-${index}`,
      temperature,
      humidity,
      status: conditionFor(temperature, humidity),
      timestamp: now - (27 - index) * 60_000,
    };
  });
}

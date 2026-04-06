// --- Constants ---
const ZONE_SCORES = Object.freeze({
  danger: 40,
  safe: -20,
  neutral: 0,
});

const SCORE_MODIFIERS = Object.freeze({
  NIGHT_TIME: 30,
  LOW_SPEED: 20,
});

const NIGHT_START_HOUR = 20;
const NIGHT_END_HOUR = 6;
const LOW_SPEED_THRESHOLD = 0.5;

const RISK_THRESHOLDS = Object.freeze({
  HIGH: 70,
  MEDIUM: 40,
});

const DEFAULT_RESULT = Object.freeze({ level: "LOW", score: 0 });

// --- Validators ---
const isValidZoneType = (zoneType) =>
  typeof zoneType === "string" && zoneType in ZONE_SCORES;

const isValidHour = (hour) =>
  typeof hour === "number" && Number.isInteger(hour) && hour >= 0 && hour <= 23;

const isValidSpeed = (speed) =>
  speed == null || (typeof speed === "number" && isFinite(speed) && speed >= 0);

// --- Helpers ---
const isNightTime = (hour) => hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;

const isLowSpeed = (speed) => speed < LOW_SPEED_THRESHOLD;

const classifyRiskLevel = (score) => {
  if (score >= RISK_THRESHOLDS.HIGH) return "HIGH";
  if (score >= RISK_THRESHOLDS.MEDIUM) return "MEDIUM";
  return "LOW";
};

// --- Main Function ---
export function getRiskLevel(zoneType, hour, speed) {
  if (!isValidZoneType(zoneType) || !isValidHour(hour)) {
    return DEFAULT_RESULT;
  }

  // Handle null/undefined speed safely (common in GPS)
  const safeSpeed = speed ?? 0;

  let score = 0;

  // Zone contribution
  score += ZONE_SCORES[zoneType];

  // Night time contribution
  if (isNightTime(hour)) {
    score += SCORE_MODIFIERS.NIGHT_TIME;
  }

  // Low speed contribution
  if (isLowSpeed(safeSpeed)) {
    score += SCORE_MODIFIERS.LOW_SPEED;
  }

  // Optional: prevent negative score
  score = Math.max(0, score);

  return {
    level: classifyRiskLevel(score),
    score,
  };
}
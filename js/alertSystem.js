// alertSystem.js

// ─── Constants ───────────────────────────────────────────────────────────────

const RISK_LEVELS = Object.freeze(["LOW", "MEDIUM", "HIGH"]);

const COLORS = Object.freeze({
  LOW:    { text: "#166534", background: "#dcfce7", border: "#22c55e" },
  MEDIUM: { text: "#7c2d12", background: "#ffedd5", border: "#f97316" },
  HIGH:   { text: "#ffffff", background: "#ef4444", border: "#b91c1c" },
});

const IDS = Object.freeze({
  CONTAINER : "ass-container",
  BANNER    : "ass-banner",
  BADGE     : "ass-badge",
});

const TIMING = Object.freeze({
  AUTO_ALERT_MS    : 10_000,
  FLASH_INTERVAL_MS: 700,
  HIDE_FADE_MS     : 300,
});

// ─── Module State ─────────────────────────────────────────────────────────────

const state = {
  currentLevel     : null,
  autoAlertTimer   : null,
  flashInterval    : null,
};

// ─── DOM Helpers ──────────────────────────────────────────────────────────────

function applyStyles(el, styles) {
  Object.assign(el.style, styles);
}

function getOrCreate(id, tag, buildFn) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement(tag);
    el.id = id;
    buildFn(el);
  }
  return el;
}

function getOrCreateContainer() {
  return getOrCreate(IDS.CONTAINER, "div", (el) => {
    applyStyles(el, {
      position     : "fixed",
      top          : "0",
      left         : "0",
      width        : "100%",
      zIndex       : "999999",
      pointerEvents: "none",
      fontFamily   : "system-ui, -apple-system, sans-serif",
    });
    document.body.prepend(el);
  });
}

function getOrCreateBanner(container) {
  return getOrCreate(IDS.BANNER, "div", (el) => {
    applyStyles(el, {
      display        : "none",
      width          : "100%",
      padding        : "14px 20px",
      boxSizing      : "border-box",
      backgroundColor: COLORS.HIGH.background,
      color          : COLORS.HIGH.text,
      textAlign      : "center",
      fontWeight     : "700",
      fontSize       : "15px",
      letterSpacing  : "0.06em",
      opacity        : "0",
      transition     : `opacity ${TIMING.HIDE_FADE_MS}ms ease`,
    });
    el.textContent = "⚠️  HIGH RISK DETECTED — STAY ALERT";
    container.prepend(el);
  });
}

function getOrCreateBadge(container) {
  return getOrCreate(IDS.BADGE, "div", (el) => {
    applyStyles(el, {
      position     : "fixed",
      bottom       : "24px",
      right        : "24px",
      padding      : "10px 22px",
      borderRadius : "999px",
      fontWeight   : "700",
      fontSize     : "13px",
      letterSpacing: "0.08em",
      boxShadow    : "0 4px 14px rgba(0,0,0,0.18)",
      transition   : "background-color 0.35s ease, color 0.35s ease, border-color 0.35s ease",
      pointerEvents: "none",
      zIndex       : "999999",
      border       : "2px solid transparent",
    });
    container.appendChild(el);
  });
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function renderBadge(badge, level) {
  const { text, background, border } = COLORS[level];
  badge.textContent       = `RISK: ${level}`;
  badge.style.color       = text;
  badge.style.backgroundColor = background;
  badge.style.borderColor = border;
}

// ─── Banner ───────────────────────────────────────────────────────────────────

function showBanner(banner) {
  banner.style.display = "block";
  // Force reflow so transition plays from opacity 0
  void banner.offsetHeight;
  banner.style.opacity = "1";
  startFlash(banner);
}

function hideBanner(banner) {
  stopFlash(banner);
  banner.style.opacity = "1"; // reset to solid before hiding
  banner.style.transition = `opacity ${TIMING.HIDE_FADE_MS}ms ease`;
  banner.style.opacity = "0";
  setTimeout(() => {
    if (state.currentLevel !== "HIGH") {
      banner.style.display = "none";
    }
  }, TIMING.HIDE_FADE_MS);
}

function startFlash(banner) {
  if (state.flashInterval !== null) return;
  let visible = true;
  state.flashInterval = setInterval(() => {
    visible = !visible;
    banner.style.opacity = visible ? "1" : "0.25";
  }, TIMING.FLASH_INTERVAL_MS);
}

function stopFlash(banner) {
  if (state.flashInterval === null) return;
  clearInterval(state.flashInterval);
  state.flashInterval = null;
  banner.style.opacity = "1";
}

// ─── Auto Alert ───────────────────────────────────────────────────────────────

function triggerAutoAlert() {
  console.warn(
    "[AlertSystem] 🚨 AUTO ALERT: User has remained in HIGH risk zone for over " +
    `${TIMING.AUTO_ALERT_MS / 1000} seconds.`
  );
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate([500, 200, 500]);
  }
}

function startAutoAlertTimer() {
  if (state.autoAlertTimer !== null) return;
  state.autoAlertTimer = setTimeout(() => {
    if (state.currentLevel === "HIGH") triggerAutoAlert();
  }, TIMING.AUTO_ALERT_MS);
}

function clearAutoAlertTimer() {
  if (state.autoAlertTimer === null) return;
  clearTimeout(state.autoAlertTimer);
  state.autoAlertTimer = null;
}

// ─── High Risk Entry / Exit ───────────────────────────────────────────────────

function handleHighRisk(banner) {
  showBanner(banner);
  startAutoAlertTimer();
}

function handleRiskExit(banner) {
  hideBanner(banner);
  clearAutoAlertTimer();
}

// ─── Core Export ──────────────────────────────────────────────────────────────

/**
 * Updates the alert UI based on the current risk level.
 *
 * Integration:
 *   import { updateAlertSystem } from './alertSystem.js';
 *   const { level } = getRiskLevel(zoneType, hour, speed);
 *   updateAlertSystem(level);
 *
 * @param {string} level - "LOW" | "MEDIUM" | "HIGH"
 */
export function updateAlertSystem(level) {
  if (typeof level !== "string" || !RISK_LEVELS.includes(level)) {
    console.warn(`[AlertSystem] Invalid risk level: "${level}". Expected LOW | MEDIUM | HIGH.`);
    return;
  }

  // Skip redundant updates
  if (level === state.currentLevel) return;

  const previousLevel   = state.currentLevel;
  state.currentLevel    = level;

  const container = getOrCreateContainer();
  const banner    = getOrCreateBanner(container);
  const badge     = getOrCreateBadge(container);

  renderBadge(badge, level);

  if (level === "HIGH") {
    handleHighRisk(banner);
  } else if (previousLevel === "HIGH") {
    handleRiskExit(banner);
  }
}

// ─── Browser Console Test Hook ────────────────────────────────────────────────

if (typeof window !== "undefined") {
  window.__alertSystemTest = updateAlertSystem;
  console.info(
    "[AlertSystem] Test hook ready → window.__alertSystemTest('LOW' | 'MEDIUM' | 'HIGH')"
  );
}
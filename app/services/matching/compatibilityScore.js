// app/services/matching/compatibilityScore.js

// ---------- WEIGHTS ----------

// Same-day (pumpNow) scoring
const SAME_DAY_GYM_WEIGHT = 50;           // dominates everything else
const SAME_DAY_TIME_WEIGHT = 15;          // 2nd most important
const SAME_DAY_SCHEDULE_WEIGHT = 15;       // days still matter
const SAME_DAY_SPLIT_WEIGHT = 10;  // split can be nice to have but isnt as important
const SAME_DAY_GOAL_WEIGHT = 5;   // goal matters the least
const SAME_DAY_STRENGTH_CLOSE = 5;        // bonus for being close     

// Long-term scoring
const LONG_TERM_GYM_WEIGHT = 40;          // still dominates
const LONG_TERM_SCHEDULE_WEIGHT = 10;     // 3rd most important (days overlap)
const LONG_TERM_SPLIT_WEIGHT = 40;        // 2nd most important (want same split for consistency)
const LONG_TERM_GOAL_WEIGHT = 2.5;      // goal matters but less
const LONG_TERM_TIME_WEIGHT = 5;         // time important but below schedule
const LONG_TERM_STRENGTH_CLOSE = 2.5;     // small bonus


// ---- MAX SCORES FOR PERCENT CALC ----

const SAME_DAY_MAX_SCORE =
  SAME_DAY_GYM_WEIGHT +
  SAME_DAY_TIME_WEIGHT +
  SAME_DAY_SPLIT_WEIGHT +
  SAME_DAY_GOAL_WEIGHT +
  SAME_DAY_SCHEDULE_WEIGHT 
  ;

const LONG_TERM_MAX_SCORE =
  LONG_TERM_GYM_WEIGHT +
  LONG_TERM_SCHEDULE_WEIGHT +
  LONG_TERM_SPLIT_WEIGHT +
  LONG_TERM_GOAL_WEIGHT +
  LONG_TERM_TIME_WEIGHT 
   

export function getMaxCompatibilityScore(mode) {
  if (mode === "pumpNow") return SAME_DAY_MAX_SCORE;
  if (mode === "longTerm") return LONG_TERM_MAX_SCORE;
  return LONG_TERM_MAX_SCORE;
}

// ---------- PUBLIC WRAPPER ----------

export function computeCompatibilityScore(me, other, options = {}) {
  const { mode } = options || {};

  if (mode === "pumpNow") {
    return computeSameDayCompatibilityScore(me, other, options);
  }
  if (mode === "longTerm") {
    return computeLongTermCompatibilityScore(me, other, options);
  }

  // default: treat like long-term if mode is missing/unknown
  return computeLongTermCompatibilityScore(me, other, options);
}

// ---------- SAME-DAY / PUMPNOW ALGORITHM ----------
function computeSameDayCompatibilityScore(me, other, options = {}) {
  const { category } = options;
  if (!me || !other) return 0;

  const meGym = normalizeGym(me.gym);
  const otherGym = normalizeGym(other.gym);

  const meTime = (me.time || "").trim().toLowerCase();
  const otherTime = (other.time || "").trim().toLowerCase();

  const meDays = Array.isArray(me.days) ? me.days : [];
  const otherDays = Array.isArray(other.days) ? other.days : [];

  const meGoal = normalizeGoal(me.goal);
  const otherGoal = normalizeGoal(other.goal);

  const meSplit = (me.split || "").trim().toLowerCase();
  const otherSplit = (other.split || "").trim().toLowerCase();

  const meStrength = (me.strengthLevel || "").trim().toLowerCase();
  const otherStrength = (other.strengthLevel || "").trim().toLowerCase();

  const normCategory = (category || "").trim().toLowerCase();

  let score = 0;

  // 1) Same gym
  if (meGym && otherGym && meGym === otherGym) {
    score += SAME_DAY_GYM_WEIGHT;
  }

  // 2) Same time
  if (meTime && otherTime && meTime === otherTime) {
    score += SAME_DAY_TIME_WEIGHT;
  }

  // 3) Same-day schedule (match today)
  const today = new Date().toLocaleDateString("en-US", { weekday: "short" });
  if (meDays.includes(today) && otherDays.includes(today)) {
    score += SAME_DAY_SCHEDULE_WEIGHT;
  }

  // 4) Category matches
  if (normCategory) {
    if (otherSplit === normCategory) {
      score += SAME_DAY_SPLIT_WEIGHT;
    }
    if (otherGoal === normCategory) {
      score += SAME_DAY_GOAL_WEIGHT;
    }
  }

  // 5) Strength level closeness bonus (ONLY +5 if close)
  const STRENGTH_ORDER = ["beginner", "intermediate", "advanced", "elite"];

  const myIndex = STRENGTH_ORDER.indexOf(meStrength);
  const otherIndex = STRENGTH_ORDER.indexOf(otherStrength);

  if (myIndex !== -1 && otherIndex !== -1) {
    if (Math.abs(myIndex - otherIndex) === 1) {
      // Only award for being close
      score += SAME_DAY_STRENGTH_CLOSE;
    }
  }

  return score;
}



// ---------- LONG-TERM ALGORITHM ----------
function computeLongTermCompatibilityScore(me, other, options = {}) {
  const { category } = options;
  if (!me || !other) return 0;

  const cat = (category || "").trim().toLowerCase();

  const meGym = normalizeGym(me.gym);
  const otherGym = normalizeGym(other.gym);

  const meTime = (me.time || "").trim().toLowerCase();
  const otherTime = (other.time || "").trim().toLowerCase();

  const meDays = Array.isArray(me.days) ? me.days : [];
  const otherDays = Array.isArray(other.days) ? other.days : [];

  const meGoal = normalizeGoal(me.goal);
  const otherGoal = normalizeGoal(other.goal);

  const meStrength = (me.strengthLevel || "").trim().toLowerCase();
  const otherStrength = (other.strengthLevel || "").trim().toLowerCase();

  let score = 0;

  // 1) Same gym (50)
  if (meGym && otherGym && meGym === otherGym) {
    score += LONG_TERM_GYM_WEIGHT;
  }

  // 2) Category match (20 points — replaces split matching)
  //    They match if the user's chosen category equals the partner's split.
  const otherSplit = (other.split || "").trim().toLowerCase();
  if (cat && otherSplit === cat) {
    score += LONG_TERM_SPLIT_WEIGHT;
  }

  // 3) Partial schedule match (15)
  const shared = otherDays.filter((d) => meDays.includes(d));
  const maxLen = Math.max(meDays.length, otherDays.length, 1);
  const ratio = shared.length / maxLen;
  score += ratio * LONG_TERM_SCHEDULE_WEIGHT;

  // 4) Time match (10)
  if (meTime && otherTime && meTime === otherTime) {
    score += LONG_TERM_TIME_WEIGHT;
  }

  // 5) Goal match (5)
  if (meGoal && otherGoal && meGoal === otherGoal) {
    score += LONG_TERM_GOAL_WEIGHT;
  }

  // 6) Strength closeness (5)
  const ORDER = ["beginner", "intermediate", "advanced", "elite"];
  const a = ORDER.indexOf(me.strengthLevel);
  const b = ORDER.indexOf(other.strengthLevel);

  if (a !== -1 && b !== -1 && Math.abs(a - b) === 1) {
    score += LONG_TERM_STRENGTH_CLOSE;
  }

  return score;
}



// ---------- HELPERS & TAGS ----------

function normalizeGym(gym) {
  if (!gym) return "";
  return String(gym).trim().toLowerCase();
}

function normalizeGoal(goal) {
  if (!goal) return "";
  return String(goal).trim().toLowerCase();
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildProfileTags(profile, options = {}) {
  const { mode, category } = options || {};
  const tags = [];

  if (profile.split) {
    tags.push(profile.split);
  }

  if (profile.goal) {
    tags.push(capitalize(profile.goal));
  }

  if (profile.gym) {
    tags.push(capitalize(profile.gym));
  }

  if (profile.time) {
    tags.push(profile.time);
  }

  if (Array.isArray(profile.days) && profile.days.length > 0) {
    tags.push(profile.days.join("/"));
  }



  if (mode === "pumpNow") {
    tags.push("Same-day sesh");
  } else if (mode === "longTerm") {
    tags.push("Long-term partner");
  }

  return tags;
}

export function computeCompatibilityScore(me, other, options = {}) {
  const { mode, category } = options;

  if (!me || !other) return 0;

  const meGym = normalizeGym(me.gym);
  const otherGym = normalizeGym(other.gym);

  const meTime = (me.time || "").trim();
  const otherTime = (other.time || "").trim();

  const meGoal = normalizeGoal(me.goal);
  const otherGoal = normalizeGoal(other.goal);

  const meSplit = (me.split || "").trim();
  const otherSplit = (other.split || "").trim();

  const meDays = Array.isArray(me.days) ? me.days : [];
  const otherDays = Array.isArray(other.days) ? other.days : [];

  let score = 0;

  // 1) Same gym (biggest weight)
  if (meGym && otherGym && meGym === otherGym) {
    score += 3;
  }

  // 2) Same preferred time window
  if (meTime && otherTime && meTime === otherTime) {
    score += 2;
  }

  // 3) Same split (Push/Pull/Legs, Upper/Lower, etc.)
  if (meSplit && otherSplit && meSplit === otherSplit) {
    score += 2;
  }

  // 4) Same primary goal (strength, aesthetics, health, etc.)
  if (meGoal && otherGoal && meGoal === otherGoal) {
    score += 1;
  }

  // 5) Overlapping workout days (each shared day +1)
  const sharedDays = otherDays.filter((d) => meDays.includes(d));
  score += sharedDays.length;

  // 6) Mode-specific bonus
  // longTerm: category usually matches split type
  if (mode === "longTerm" && category && otherSplit === category) {
    score += 2;
  }

  // pumpNow: you can later hook this into a "today focus" field if you add one
  // e.g., if (mode === "pumpNow" && other.todayFocus === category) score += 2;

  return score;
}
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
  const { mode } = options;
  const tags = [];

  // split (e.g. "PPL", "Upper/Lower")
  if (profile.split) {
    tags.push(profile.split);
  }

  // goal (strength, aesthetics, etc.)
  if (profile.goal) {
    tags.push(capitalize(profile.goal));
  }

  // gym
  if (profile.gym) {
    tags.push(capitalize(profile.gym));
  }

  // time (Morning / Evening, etc.)
  if (profile.time) {
    tags.push(profile.time);
  }

  // days → "Mon/Wed/Fri"
  if (Array.isArray(profile.days) && profile.days.length > 0) {
    tags.push(profile.days.join("/"));
  }

  // mode badge
  if (mode === "pumpNow") {
    tags.push("Same-day sesh");
  } else if (mode === "longTerm") {
    tags.push("Long-term partner");
  }

  return tags;
}
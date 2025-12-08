/**
 * Partner & Pump Matching Score
 *
 * This module calculates a 0–100 compatibility score between two users.
 * It encodes the "what makes a good long-term partner" rules:
 *  - Schedule overlap matters most
 *  - Training style / split matters a lot
 *  - Goals alignment matters
 *  - Experience level fit matters
 *  - Same gym / location matters a little
 *
 * CURRENTLY OUTDATED 
 * refer to app/services/matching/compatibilityScore.js for the latest version
 *
 */

export type UserProfile = {
    uid: string;
    scheduleBlocks: string[]; // e.g. ["Mon-18", "Wed-18", "Fri-18"]
    split: string; // e.g. "Push/Pull/Legs", "Upper/Lower", "Full Body"
    goals: string[]; // e.g. ["Strength", "Hypertrophy"]
    level: string; // e.g. "Beginner" | "Intermediate" | "Advanced"
    gym: string; // e.g. "City Gym"
  };
  
  const WEIGHTS = {
    schedule: 0.4,
    split: 0.3,
    goals: 0.15,
    level: 0.1,
    gym: 0.05,
  };
  
  /**
   * Returns a score between 0 and 1 capturing how well two users'
   * workout times line up.
   *
   * Right now we treat each schedule block string literally and compare
   * intersection overlap: same day/time block = overlap.
   *
   * We normalize by the larger of the two block lists so we don't
   * unfairly reward someone who only listed 1 time.
   */
  function scoreScheduleOverlap(a: UserProfile, b: UserProfile): number {
    if (!a.scheduleBlocks?.length || !b.scheduleBlocks?.length) {
      return 0;
    }
  
    const setA = new Set(a.scheduleBlocks);
    const setB = new Set(b.scheduleBlocks);
    let intersectionCount = 0;
  
    for (const block of setA) {
      if (setB.has(block)) {
        intersectionCount += 1;
      }
    }
  
    const denom = Math.max(setA.size, setB.size);
    if (denom === 0) return 0;
  
    return intersectionCount / denom; // 0 → 1
  }
  
  /**
   * Returns a score between 0 and 1 describing training style compatibility.
   *
   * Rules:
   *  - Exact split match = 1.0
   *  - "Push/Pull/Legs" vs "Upper/Lower" = decent partial = 0.6
   *  - Otherwise "Full Body" vs strength splits etc = 0.2 baseline
   *
   * You can tune this map if you add more splits.
   */
  function scoreWorkoutSplit(a: UserProfile, b: UserProfile): number {
    const splitA = (a.split || "").toLowerCase().trim();
    const splitB = (b.split || "").toLowerCase().trim();
  
    if (!splitA || !splitB) return 0;
  
    if (splitA === splitB) return 1;
  
    // Partial compatibility heuristics:
    const strengthySplits = ["push/pull/legs", "upper/lower", "ppl", "upperlower"];
    const aIsStrengthy = strengthySplits.some((s) => splitA.includes(s));
    const bIsStrengthy = strengthySplits.some((s) => splitB.includes(s));
    if (aIsStrengthy && bIsStrengthy) {
      return 0.6;
    }
  
    // Fallback "we don't really match"
    return 0.2;
  }
  
  /**
   * Score between 0 and 1 for goals alignment.
   * We look at set intersection / union of goals (e.g. Strength, Hypertrophy).
   * If either user has no goals listed, return 0.
   */
  function scoreGoals(a: UserProfile, b: UserProfile): number {
    const goalsA = new Set((a.goals || []).map((g) => g.toLowerCase().trim()));
    const goalsB = new Set((b.goals || []).map((g) => g.toLowerCase().trim()));
  
    if (goalsA.size === 0 || goalsB.size === 0) return 0;
  
    let intersection = 0;
    for (const g of goalsA) {
      if (goalsB.has(g)) intersection += 1;
    }
  
    const union = new Set([...goalsA, ...goalsB]).size;
    if (union === 0) return 0;
  
    return intersection / union; // 0 → 1
  }
  
  /**
   * Score between 0 and 1 for experience level fit.
   *
   * Perfect match ("Intermediate" vs "Intermediate") = 1.
   * Off by one tier ("Intermediate" vs "Beginner" or "Intermediate" vs "Advanced") = 0.5
   * Anything else (e.g. "Beginner" vs "Advanced") = 0.2
   *
   * If either level missing, 0.
   */
  function scoreLevel(a: UserProfile, b: UserProfile): number {
    const ladder = ["beginner", "intermediate", "advanced"];
  
    const aLevel = ladder.indexOf((a.level || "").toLowerCase().trim());
    const bLevel = ladder.indexOf((b.level || "").toLowerCase().trim());
  
    if (aLevel === -1 || bLevel === -1) return 0;
  
    const diff = Math.abs(aLevel - bLevel);
    if (diff === 0) return 1;
    if (diff === 1) return 0.5;
    return 0.2;
  }
  
  /**
   * Score between 0 and 1 for gym/location.
   * Same gym string = 1, else 0.
   * (Later you can get fancier: distance-based scoring.)
   */
  function scoreGym(a: UserProfile, b: UserProfile): number {
    const gymA = (a.gym || "").toLowerCase().trim();
    const gymB = (b.gym || "").toLowerCase().trim();
    if (!gymA || !gymB) return 0;
    return gymA === gymB ? 1 : 0;
  }
  
  /**
   * Main exported function.
   * Returns an integer between 0 and 100.
   *
   * Throws if same uid (no self-match).
   */
  export function calculateCompatibilityScore(
    me: UserProfile,
    partner: UserProfile
  ): number {
    if (me.uid && partner.uid && me.uid === partner.uid) {
      throw new Error("Cannot calculate compatibility with self-match");
    }
  
    // individual factor scores (0..1)
    const scheduleScore = scoreScheduleOverlap(me, partner);
    const splitScore = scoreWorkoutSplit(me, partner);
    const goalsScore = scoreGoals(me, partner);
    const levelScore = scoreLevel(me, partner);
    const gymScore = scoreGym(me, partner);
  
    // weighted sum
    const weighted =
      scheduleScore * WEIGHTS.schedule +
      splitScore * WEIGHTS.split +
      goalsScore * WEIGHTS.goals +
      levelScore * WEIGHTS.level +
      gymScore * WEIGHTS.gym;
  
    // convert to 0..100 and clamp
    let finalScore = Math.round(weighted * 100);
  
    if (finalScore < 0) finalScore = 0;
    if (finalScore > 100) finalScore = 100;
  
    return finalScore;
  }
  
  /**
   * Optionally export helpers if you want to unit test them directly.
   * (Not strictly required by the tests we wrote, but nice to have.)
   */
  export const _internal = {
    scoreScheduleOverlap,
    scoreWorkoutSplit,
    scoreGoals,
    scoreLevel,
    scoreGym,
    WEIGHTS,
  };
  
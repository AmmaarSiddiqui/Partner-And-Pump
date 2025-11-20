import React, { createContext, useContext, useMemo, useState } from "react";

/**
 * Simple in-memory store for matches:
 * matches: [{ id, name, category, mode, days: ["Mon","Wed"] }]
 */
const MatchesCtx = createContext(null);

export function MatchesProvider({ children }) {
  const [matches, setMatches] = useState([]);

  const addMatch = (m) =>
    setMatches((prev) => {
      const exists = prev.some(
        (x) => x.id === m.id && x.mode === m.mode && x.category === m.category
      );
      return exists ? prev : [...prev, m];
    });

  const cancelMatch = (id, mode, category) =>
    setMatches((prev) =>
      prev.filter((m) => !(m.id === id && m.mode === mode && m.category === category))
    );

  const value = useMemo(() => ({ matches, addMatch, cancelMatch }), [matches]);
  return <MatchesCtx.Provider value={value}>{children}</MatchesCtx.Provider>;
}

export function useMatches() {
  const v = useContext(MatchesCtx);
  if (!v) throw new Error("useMatches must be used inside <MatchesProvider>");
  return v;
}
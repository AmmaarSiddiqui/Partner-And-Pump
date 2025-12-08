// app/screens/MatchListScreen.js

import React, { useLayoutEffect, useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Text, ActivityIndicator } from "react-native";
import { useTheme } from "@react-navigation/native";
import { collection, getDocs, query, where } from "firebase/firestore";


import { auth, db } from "../services/firebase";
import { useAuth } from "../state/useAuthContext";
import { useMatches } from "../state/useMatchesContext";
import UserCard from "../components/UserCard";
import {
  computeCompatibilityScore,
  buildProfileTags,
  getMaxCompatibilityScore,
} from "../services/matching/compatibilityScore";

export default function MatchListScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { category, mode } = route.params; // "pumpNow" | "longTerm"
  const { profile } = useAuth();           // 👈 this is *me*
  const { addMatch } = useMatches();

  const [sentIds, setSentIds] = useState(new Set());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    const modeText = mode === "pumpNow" ? "Same-Day" : "Long-Term";
    navigation.setOptions({ title: `${category} — ${modeText}` });
  }, [navigation, category, mode]);

  useEffect(() => {
  let isMounted = true;

  // still loading my own profile? don't try to match yet
  if (profile === undefined) {
    return;
  }

  const loadMatches = async () => {
    setLoading(true);
    try {
      const myUid = auth.currentUser?.uid || null;
      if (!myUid) {
        if (isMounted) {
          setData([]);
          setSentIds(new Set());
        }
        return;
      }

      // 0) Find all confirmed matches for me -> exclude these people
      const matchesSnap = await getDocs(
        query(
          collection(db, "matches"),
          where("users", "array-contains", myUid)
        )
      );

      const matchedPartnerIds = new Set();
      matchesSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const users = Array.isArray(data.users) ? data.users : [];
        users.forEach((u) => {
          if (u !== myUid) {
            matchedPartnerIds.add(u);
          }
        });
      });

      // 1) Find all sent match requests (outgoing) for this mode+category
      const sentSnap = await getDocs(
        query(
          collection(db, "matchRequests"),
          where("fromUserId", "==", myUid),
          where("mode", "==", mode),
          where("category", "==", category),
          where("status", "==", "pending")
        )
      );

      const newSentIds = new Set();
      sentSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.toUserId) {
          newSentIds.add(data.toUserId);
        }
      });

      if (!isMounted) return;
      setSentIds(newSentIds);

      // 2) get ALL profiles from Firestore
      const snap = await getDocs(collection(db, "profiles"));
      const allProfiles = [];
      snap.forEach((docSnap) => {
        allProfiles.push({ id: docSnap.id, ...docSnap.data() });
      });

      // 3) split: me vs others, and exclude people I'm already matched with
      const others = allProfiles.filter(
        (p) => p.id !== myUid && !matchedPartnerIds.has(p.id)
      );

      let result;

      if (!profile) {
        // logged in but no profile data yet: just show others, no score
        result = others.map((p) => ({
          id: p.id,
          name: p.name || "John Kim",
          age: p.age || null,
          bio: p.about || "",
          tags: buildProfileTags(p, { mode }),
          scheduleDays: Array.isArray(p.days) ? p.days : [],
          score: 0,
        }));
      } else {
        // we have *me* (my profile) → compare me vs each other
        result = others
          .map((p) => {
            const rawScore = computeCompatibilityScore(profile, p, { mode, category });
            const maxScore = getMaxCompatibilityScore(mode);

            const percentScore =
              maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;

            return {
              id: p.id,
              name: p.name || "Gym partner",
              age: p.age || null,
              bio: p.about || "",
              tags: buildProfileTags(p, { mode, category }),
              scheduleDays: Array.isArray(p.days) ? p.days : [],
              score: percentScore,   // what you show in the UI
              rawScore,              // what we filter/sort on
            };
          })
          // only drop people who are *literally* 0 score
          .filter((m) => m.rawScore > 0)
          .sort((a, b) => b.rawScore - a.rawScore);
      }

      if (isMounted) {
        setData(result);
      }
    } catch (e) {
      console.warn("[MatchList] load error:", e);
      if (isMounted) setData([]);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  loadMatches();
  return () => {
    isMounted = false;
  };
}, [mode, category, profile]);


  const handleMatch = (item) => {
  // Optimistic UI: mark as "sent" immediately
  setSentIds((prev) => {
    const next = new Set(prev);
    next.add(item.id);
    return next;
  });

  // Actually send match request
  addMatch({
    id: item.id,
    name: item.name,
    category,
    mode,
    days: item.scheduleDays ?? [],
  });
};


  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
        ]}
      >
        <ActivityIndicator />
        <Text style={{ color: colors.text, marginTop: 8 }}>Finding your best matches…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {data.length === 0 ? (
        <Text style={{ color: colors.text, padding: 20 }}>
          No profiles yet for this selection.
        </Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserCard
              name={item.name}
              age={item.age}
              score={item.score}
              bio={item.bio}
              tags={item.tags}
              isMatched={sentIds.has(item.id)}    
              onMatch={() => handleMatch(item)}
            />

          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 20 },
});


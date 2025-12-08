// app/components/PlaceAutocomplete.jsx
// Yasir: Gym search with Google Places, tappable dropdown

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Pressable,
  Text,
  StyleSheet,
} from "react-native";
import { autocompleteGyms, getPlaceDetails } from "../../src/API/googlePlaces";

export default function PlaceAutocomplete({
  placeholder = "Search your gym",
  onSelect,           // <- single callback name everywhere
  initialValue = "",
}) {
  const [query, setQuery] = useState(initialValue || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  const tokenRef = useRef(Math.random().toString(36).slice(2));

  // keep input in sync if initialValue comes in later
  useEffect(() => {
    if (initialValue && !query) {
      setQuery(initialValue);
    }
  }, [initialValue, query]);

  // search as user types
  useEffect(() => {
    const id = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }

      console.log("[PlaceAutocomplete] search:", q);

      try {
        const r = await autocompleteGyms(q, tokenRef.current);
        console.log("[PlaceAutocomplete] results:", r.length);
        setResults(r);
        setOpen(true);
      } catch (e) {
        console.warn("[autocomplete error]", e);
      }
    }, 250);

    return () => clearTimeout(id);
  }, [query]);

  const handlePick = async (item) => {
    console.log("[PlaceAutocomplete] pick:", item.placeId);

    // show something immediately so it feels responsive
    const fallbackName = item.description || item.name || "";
    setQuery(fallbackName);
    setOpen(false);
    onSelect?.({
      name: fallbackName,
      description: item.description,
      placeId: item.placeId,
    });

    // then try to grab full details in the background
    try {
      const details = await getPlaceDetails(item.placeId, tokenRef.current);
      if (details) {
        const finalName = details.name || fallbackName;
        setQuery(finalName);
        onSelect?.(details);
      }
    } catch (e) {
      console.warn("[details error]", e);
    }
  };

  return (
    <View style={styles.wrapper}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor="#9aa"
        style={styles.input}
      />

      {open && results.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={results}
            keyExtractor={(i) => i.placeId}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handlePick(item)}
                style={styles.item}
              >
                <Text style={styles.itemText}>{item.description}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#556",
    padding: 12,
    borderRadius: 12,
    color: "#fff",
    backgroundColor: "#0f1220",
  },
  dropdown: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "#0f1220",
    borderWidth: 1,
    borderColor: "#334",
    borderRadius: 12,
    maxHeight: 240,
    zIndex: 50,      // <- helps taps work above other views
    elevation: 10,   // <- Android
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#223",
  },
  itemText: {
    color: "#fff",
  },
});


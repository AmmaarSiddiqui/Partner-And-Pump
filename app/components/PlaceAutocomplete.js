// app/components/PlaceAutocomplete.jsx
// UI improved for clearer dropdown visibility

import React, { useEffect, useRef, useState } from "react";
import { View, TextInput, FlatList, Pressable, Text } from "react-native";
import { autocompleteGyms, getPlaceDetails } from "../../src/API/googlePlaces";

export default function PlaceAutocomplete({
  placeholder = "Search your gym",
  onSelect,
  initialValue = "",       //  accept initial value
}) {
  const [query, setQuery] = useState(initialValue || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  const tokenRef = useRef(Math.random().toString(36).slice(2));

  // sync if initialValue changes later (profile loads async)
  useEffect(() => {
    if (initialValue && !query) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    const id = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }

      console.log("[PlaceAutocomplete] search:", q); // debug to terminal

      try {
        const r = await autocompleteGyms(q, tokenRef.current);
        console.log("[PlaceAutocomplete] results:", r.length); //  debug
        setResults(r);
        setOpen(true);
      } catch (e) {
        console.warn("[autocomplete error]", e);
      }
    }, 250);

    return () => clearTimeout(id);
  }, [query]);

  const handlePick = async (item) => {
    console.log("[PlaceAutocomplete] pick:", item.placeId); //  debug

    try {
      const details = await getPlaceDetails(item.placeId, tokenRef.current);
      if (details) {
        setQuery(details.name);
        setOpen(false);
        onSelect?.(details);
      }
    } catch (e) {
      console.warn("[details error]", e);
    }
  };

  return (
    <View style={{ position: "relative" }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor="#9aa"
        style={{
          borderWidth: 1,
          borderColor: "#556",
          padding: 12,
          borderRadius: 12,
          color: "#fff",
          backgroundColor: "#0f1220",
        }}
      />

      {open && results.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: 52,
            left: 0,
            right: 0,
            backgroundColor: "#0f1220",
            borderWidth: 1,
            borderColor: "#334",
            borderRadius: 12,
            maxHeight: 240,
          }}
        >
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={results}
            keyExtractor={(i) => i.placeId}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handlePick(item)}
                style={{
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#223",
                }}
              >
                <Text style={{ color: "#fff" }}>{item.description}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

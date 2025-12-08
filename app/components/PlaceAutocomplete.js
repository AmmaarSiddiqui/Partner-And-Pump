// app/components/PlaceAutocomplete.jsx

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
  onSelect,
  initialValue = "",
}) {
  const [query, setQuery] = useState(initialValue || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [hasUserTyped, setHasUserTyped] = useState(false); 

  const tokenRef = useRef(Math.random().toString(36).slice(2));

  // keep input in sync if initialValue comes in later,
  // but only if user hasn't manually typed yet
  useEffect(() => {
    if (!hasUserTyped && initialValue) {
      setQuery(initialValue);
    }
  }, [initialValue, hasUserTyped]);

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

    const fallbackName = item.description || item.name || "";
    setHasUserTyped(true);           // User effectively chose a value
    setQuery(fallbackName);
    setOpen(false);
    onSelect?.({
      name: fallbackName,
      description: item.description,
      placeId: item.placeId,
    });

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
        onChangeText={(text) => {
          setHasUserTyped(true);     //  as soon as they type, stop auto-resetting
          setQuery(text);
        }}
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
            scrollEnabled={false}    // fixes nested ScrollView warning
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
    zIndex: 50,
    elevation: 10,
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

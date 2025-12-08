// src/API/googlePlaces.js
// Helpers for talking to the Google Places API (New).

// HARD-CODE your new Google Places API key
const GOOGLE_API_KEY = "AIzaSyArWbYT4-bXV3nKv8-WCn9ZRSNgK788DCs";

/**
 * Get autocomplete suggestions for gyms based on user text.
 *
 * @param {string} query  - what the user typed
 * @param {string} token  - session token for this autocomplete session
 */
export async function autocompleteGyms(query, token) {
  const url = "https://places.googleapis.com/v1/places:autocomplete";

  const body = {
    input: query,
    includedPrimaryTypes: ["gym"], // only gyms
    languageCode: "en",
    sessionToken: String(token || ""),
    includeQueryPredictions: false,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  console.log("[autocompleteGyms] raw response:", JSON.stringify(json));

  if (!json || !Array.isArray(json.suggestions)) {
    console.warn(
      "[autocompleteGyms] bad response (no suggestions):",
      json?.error?.message || json?.error_message || json
    );
    return [];
  }

  const predictions = json.suggestions
    .map((s) => s.placePrediction)
    .filter(Boolean);

  const result = predictions.map((p) => {
    const description =
      p.text?.text ||
      p.structuredFormat?.mainText?.text ||
      p.structuredFormat?.secondaryText?.text ||
      "";
    return {
      description,
      placeId: p.place, // "places/ChIJ..."
    };
  });

  console.log("[autocompleteGyms] parsed results:", result);
  return result;
}

/**
 * Get full details for a selected gym.
 *
 * @param {string} placeName
 * @param {string} token
 */
export async function getPlaceDetails(placeName, token) {
  const url = `https://places.googleapis.com/v1/${encodeURIComponent(
    placeName
  )}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
      "X-Goog-Session-Token": String(token || ""),
    },
  });

  const json = await res.json();
  console.log("[getPlaceDetails] raw response:", JSON.stringify(json));

  if (!json || json.error) {
    console.warn(
      "[getPlaceDetails] bad response:",
      json?.error?.message || json
    );
    return null;
  }

  return {
    name: json.displayName?.text || "",
    address: json.formattedAddress || "",
    location: json.location || null,
  };
}





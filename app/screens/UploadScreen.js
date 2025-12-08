// app/screens/UploadScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../state/useAuthContext";
import { db } from "../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const MAX_IMAGE_SIZE_MB = 1; // 🔧 change this if you want a different limit
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export default function UploadScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, profile } = useAuth();

  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState("");

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow photo library access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.4, // keep small for Firestore
      base64: true, // 🔑 we need base64
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImageError(""); // clear previous errors

      // Try to determine file size
      let sizeInBytes = asset.fileSize ?? null;

      // Fallback: estimate size from base64 length
      if (sizeInBytes == null && asset.base64) {
        const len = asset.base64.length;
        sizeInBytes = Math.ceil((len * 3) / 4);
      }

      if (sizeInBytes != null && sizeInBytes > MAX_IMAGE_SIZE_BYTES) {
        setImageUri(null);
        setImageBase64(null);
        const msg = `Image is too large. Please choose one under ${MAX_IMAGE_SIZE_MB}MB.`;
        setImageError(msg);
        Alert.alert("Image too large", msg);
        return;
      }

      setImageUri(asset.uri);
      setImageBase64(asset.base64 || null);
    }
  };

  const uploadPost = async () => {
    if (!user) {
      Alert.alert("Not signed in", "You must be signed in to upload.");
      return;
    }

    if (!imageBase64) {
      Alert.alert("No image", "Please choose an image first.");
      return;
    }

    const trimmedCaption = caption.trim();

    try {
      setUploading(true);

      const uid = user.uid;
      const postsRef = collection(db, "posts");

      await addDoc(postsRef, {
        userId: uid,
        username:
          profile?.username ||
          profile?.displayName ||
          profile?.name ||
          user.email ||
          "Unknown",
        caption: trimmedCaption,
        imageBase64, // 🔑 store image directly in Firestore
        createdAt: serverTimestamp(),
      });

      setUploading(false);
      setImageUri(null);
      setImageBase64(null);
      setCaption("");
      navigation.goBack();
    } catch (error) {
      console.error("Error creating post:", error);
      setUploading(false);
      Alert.alert("Upload failed", "Something went wrong. Please try again.");
    }
  };

  const confirmUpload = () => {
    if (!imageBase64) {
      Alert.alert("Add an image first");
      return;
    }

    Alert.alert("Confirm Upload", "Are you sure you want to upload this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Upload",
        onPress: () => {
          if (!uploading) uploadPost();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>New Post</Text>

      {/* Image Picker */}
      <TouchableOpacity
        style={[
          styles.imagePicker,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={pickImage}
        disabled={uploading}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <View style={styles.imagePlaceholderContent}>
            <Text style={[styles.imagePlaceholderText, { color: colors.text }]}>
              Tap to choose an image (max {MAX_IMAGE_SIZE_MB}MB)
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Image error message */}
      {imageError ? (
        <Text style={[styles.errorText, { color: colors.notification || "red" }]}>
          {imageError}
        </Text>
      ) : null}

      {/* Caption Input */}
      <TextInput
        style={[
          styles.captionInput,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="Write a caption..."
        placeholderTextColor={colors.text + "66"}
        value={caption}
        onChangeText={setCaption}
        multiline
        editable={!uploading}
      />

      {/* Upload Button */}
      <TouchableOpacity
        style={[
          styles.uploadButton,
          {
            backgroundColor: colors.primary,
            opacity: imageBase64 && !uploading ? 1 : 0.6,
          },
        ]}
        onPress={confirmUpload}
        disabled={!imageBase64 || uploading}
      >
        <Text style={styles.uploadButtonText}>
          {uploading ? "Uploading..." : "Upload"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  imagePicker: {
    height: 220,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholderContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.8,
    textAlign: "center",
  },
  errorText: {
    marginBottom: 8,
    fontSize: 13,
  },
  captionInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  uploadButton: {
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

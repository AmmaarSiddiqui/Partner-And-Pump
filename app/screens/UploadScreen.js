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

export default function UploadScreen({ navigation }) {
  const { colors } = useTheme();
  const [imageUri, setImageUri] = useState(null);
  const [caption, setCaption] = useState("");

  const pickImage = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow photo library access.");
      return;
    }

    // Open picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const confirmUpload = () => {
    if (!imageUri) {
      Alert.alert("Add an image first");
      return;
    }

    Alert.alert(
      "Confirm Upload",
      "Are you sure you want to upload this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upload",
          onPress: () => {
            console.log("Uploading post:", { imageUri, caption });
            navigation.goBack();
          },
        },
      ]
    );
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
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <View style={styles.imagePlaceholderContent}>
            <Text style={[styles.imagePlaceholderText, { color: colors.text }]}>
              Tap to choose an image
            </Text>
          </View>
        )}
      </TouchableOpacity>

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
        placeholderTextColor={colors.text + "66"} // more visible
        value={caption}
        onChangeText={setCaption}
        multiline
      />

      {/* Upload Button */}
      <TouchableOpacity
        style={[
          styles.uploadButton,
          { backgroundColor: colors.primary, opacity: imageUri ? 1 : 0.6 },
        ]}
        onPress={confirmUpload}
      >
        <Text style={styles.uploadButtonText}>Upload</Text>
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
    marginBottom: 16,
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

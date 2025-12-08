import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { db } from "../services/firebase";
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { useAuth } from "../state/useAuthContext";

// Using a placeholder for images
const getPlaceholderImage = (seed) =>
  `https://picsum.photos/seed/${seed}/600/800`;

export default function PostCard({ post }) {
  const { colors } = useTheme();
  const { user, profile } = useAuth();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const displayName =
    profile?.username ||
    profile?.displayName ||
    profile?.name ||
    user?.email ||
    "You";

  const mainImageSource = post.imageBase64
    ? { uri: `data:image/jpeg;base64,${post.imageBase64}` }
    : { uri: getPlaceholderImage(post.imageSeed || post.id) };

  const handleLikePress = async () => {
    if (!user) return;

    const wasLiked = liked;
    const delta = wasLiked ? -1 : 1;

    // optimistic UI update
    setLiked(!wasLiked);
    setLikeCount((prev) => prev + delta);

    try {
      const postRef = doc(db, "posts", post.id);
      await updateDoc(postRef, {
        likes: increment(delta),
      });
    } catch (e) {
      console.error("Error updating likes:", e);
      // rollback on error
      setLiked(wasLiked);
      setLikeCount((prev) => prev - delta);
    }
  };

  const handleToggleComments = () => {
    setShowComments((prev) => !prev);
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text || !user) return;

    const newComment = {
      id: `${Date.now()}`,
      username: displayName,
      text,
    };

    // optimistic UI
    setComments((prev) => [...prev, newComment]);
    setCommentText("");

    try {
      const postRef = doc(db, "posts", post.id);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment),
      });
    } catch (e) {
      console.error("Error adding comment:", e);
      // (optional) you could rollback here if you want
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {/* Post Header (avatar + username only) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: getPlaceholderImage(post.id) }}
            style={styles.avatar}
          />
          <Text style={[styles.username, { color: colors.text }]}>
            {post.username}
          </Text>
        </View>
      </View>

      {/* Post Image */}
      <Image source={mainImageSource} style={styles.image} />

      {/* Post Footer (Actions & Caption) */}
      <View style={styles.footer}>
        <View style={styles.actions}>
          {/* Like */}
          <TouchableOpacity
            onPress={handleLikePress}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={24}
              color={liked ? "red" : colors.text}
              style={styles.actionIcon}
            />
            <Text style={[styles.likesText, { color: colors.text }]}>
              {likeCount}
            </Text>
          </TouchableOpacity>

          {/* Comments */}
          <TouchableOpacity
            onPress={handleToggleComments}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chatbubble-outline"
              size={24}
              color={colors.text}
              style={styles.actionIcon}
            />
            <Text style={[styles.comments, { color: "gray" }]}>
              {comments.length} Comments
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.caption, { color: colors.text }]}>
          <Text style={{ fontWeight: "bold" }}>{post.username}</Text>{" "}
          {post.caption}
        </Text>

        {/* Comments list + input */}
        {showComments && (
          <View style={styles.commentsSection}>
            {comments.map((c) => (
              <Text
                key={c.id}
                style={[styles.commentText, { color: colors.text }]}
              >
                <Text style={styles.commentUsername}>{c.username} </Text>
                {c.text}
              </Text>
            ))}

            <View style={styles.commentInputRow}>
              <TextInput
                style={[
                  styles.commentInput,
                  { borderColor: colors.border, color: colors.text },
                ]}
                placeholder="Add a comment..."
                placeholderTextColor={colors.border}
                value={commentText}
                onChangeText={setCommentText}
                returnKeyType="send"
                onSubmitEditing={handleAddComment}
              />
              <TouchableOpacity
                onPress={handleAddComment}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="send" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  username: {
    fontWeight: "600",
  },
  image: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: "#333",
  },
  footer: {
    padding: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  actionIcon: {
    marginRight: 6,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  likesText: {
    fontSize: 14,
  },
  comments: {
    fontSize: 14,
  },
  caption: {
    fontSize: 14,
    marginTop: 4,
  },
  commentsSection: {
    marginTop: 8,
  },
  commentText: {
    fontSize: 13,
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: "600",
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    marginRight: 8,
  },
});

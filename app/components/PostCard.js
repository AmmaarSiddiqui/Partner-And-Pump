import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useTheme, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { db } from "../services/firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { useAuth } from "../state/useAuthContext";

const getPlaceholderImage = (seed) =>
  `https://picsum.photos/seed/${seed}/600/800`;

export default function PostCard({ post }) {
  const { colors } = useTheme();
  const navigation = useNavigation();              // useNavigation like MessagesScreen
  const { user } = useAuth();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const postRef = doc(db, "posts", post.id);

 const handleMessagePress = async () => {
    if (!user) return;

    // figure out who owns the post
    const ownerId = post.ownerId || post.userId || post.uid;
    if (!ownerId) {
      console.log("[PostCard] No ownerId on post, cannot start chat.");
      return;
    }

    // don't DM yourself
    if (ownerId === user.uid) {
      console.log("[PostCard] Tried to DM yourself, skipping.");
      return;
    }

    try {
      // use same collection as MessagesScreen
      const matchesRef = collection(db, "matches");

      const pair = [user.uid, ownerId].sort();
      const pairKey = pair.join("_"); // optional, but nice to store

      // get all matches that include me
      const q = query(matchesRef, where("userIds", "array-contains", user.uid));
      const snap = await getDocs(q);

      let chatId = null;

      snap.forEach((docSnap) => {
        const data = docSnap.data() || {};
        if (Array.isArray(data.userIds) && data.userIds.includes(ownerId)) {
          chatId = docSnap.id; //  conversation between me + owner
        }
      });

      // if no existing match/chat, create one
      if (!chatId) {
        const newMatchDoc = await addDoc(matchesRef, {
          userIds: pair,
          userPair: pairKey,
          createdAt: serverTimestamp(),
          lastMessageAt: null,
          lastMessageText: "",
        });
        chatId = newMatchDoc.id;
      }

      // navigate to Chat using same params as MessagesScreen
      navigation.navigate("Chat", {
        recipientName:  post.username ,
        matchId: chatId,
        recipientId: ownerId,
      });
    } catch (err) {
      console.log("Error starting chat from post:", err);
    }
  };



  const handleLikePress = async () => {
    const nextLiked = !liked;
    const nextCount = likeCount + (nextLiked ? 1 : -1);

    setLiked(nextLiked);
    setLikeCount(nextCount);

    try {
      await updateDoc(postRef, {
        likes: nextCount,
      });
    } catch (err) {
      console.log("Error updating likes:", err);
      // revert on error
      setLiked(liked);
      setLikeCount(likeCount);
    }
  };

  const handleToggleComments = () => {
    setShowComments((prev) => !prev);
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text) return;

    const newComment = {
      id: `${Date.now()}`,
      userId: user?.uid || "anon",
      username: user?.displayName || post.username || "You",
      text,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, newComment]);
    setCommentText("");

    try {
      await updateDoc(postRef, {
        comments: arrayUnion({
          ...newComment,
          createdAt: serverTimestamp(),
        }),
      });
    } catch (err) {
      console.log("Error adding comment:", err);
    }
  };

  const mainImageSource = post.imageBase64
    ? { uri: `data:image/jpeg;base64,${post.imageBase64}` }
    : { uri: getPlaceholderImage(post.imageSeed || post.id) };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {/* Header */}
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

      {/* Image */}
      <Image source={mainImageSource} style={styles.image} />

      {/* Footer */}
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

          {/* Message Owner */}
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={handleMessagePress}
          >
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.caption, { color: colors.text }]}>
          <Text style={{ fontWeight: "bold" }}>{post.username}</Text>{" "}
          {post.caption}
        </Text>

        {/* Comments */}
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
  messageBtn: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  messageBtnText: {
    color: "white",
    fontWeight: "600",

  },
});

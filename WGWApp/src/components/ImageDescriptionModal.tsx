import React, { useState } from "react";
import {
  Modal,
  View,
  Image,
  TextInput,
  Button,
  StyleSheet,
} from "react-native";

export const ImageDescriptionModal = ({ imageUri, onClose, onSubmit }) => {
  const [description, setDescription] = useState("");
  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <TextInput
            style={styles.input}
            placeholder="Tell us about this image..."
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Button title="Submit" onPress={() => onSubmit(description)} />
          <Button title="Cancel" onPress={onClose} color="gray" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0008",
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: 320,
    alignItems: "center",
  },
  image: { width: 200, height: 200, borderRadius: 8, marginBottom: 16 },
  input: {
    width: "100%",
    minHeight: 60,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    padding: 8,
  },
});

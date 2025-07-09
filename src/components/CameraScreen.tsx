import React, { useRef, useState, useEffect } from "react";
import { Camera } from 'expo-camera';
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type CameraScreenProps = {
  onPictureTaken: (uri: string) => void;
  onClose: () => void;
};

export const CameraScreen: React.FC<CameraScreenProps> = ({
  onPictureTaken,
  onClose,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  if (hasPermission === null) {
    return (
      <View>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={{ flex: 1 }}
        ref={cameraRef}
        type={Camera.Constants.Type.back}
      />
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            if (cameraRef.current) {
              const photo = await cameraRef.current.takePictureAsync();
              onPictureTaken(photo.uri);
            }
          }}
        >
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  controls: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  button: {
    backgroundColor: "#FF6B35",
    padding: 16,
    borderRadius: 30,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

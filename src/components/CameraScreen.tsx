import React, { useRef, useState, useEffect } from "react";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PinchGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';

type CameraScreenProps = {
  onPictureTaken: (uri: string) => void;
  onClose: () => void;
};

export const CameraScreen: React.FC<CameraScreenProps> = ({
  onPictureTaken,
  onClose,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef<CameraView | null>(null);

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.container}>
        <Text>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          onPictureTaken(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handlePinchGesture = (event: any) => {
    if (event.nativeEvent.scale) {
      const newZoom = Math.max(0, Math.min(1, zoom + (event.nativeEvent.scale - 1) * 0.1));
      setZoom(newZoom);
    }
  };

  const zoomIn = () => {
    setZoom(current => Math.min(1, current + 0.1));
  };

  const zoomOut = () => {
    setZoom(current => Math.max(0, current - 0.1));
  };

  const openPhotoLibrary = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow photo library access to select photos.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [1, 1], // Square aspect ratio
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onPictureTaken(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <PinchGestureHandler onGestureEvent={handlePinchGesture}>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            ref={cameraRef}
            facing={facing}
            zoom={zoom}
          />
          
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Zoom Controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
              <Ionicons name="remove" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.zoomIndicator}>
              <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
            </View>
            <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Photo Library Button */}
            <TouchableOpacity style={styles.libraryButton} onPress={openPhotoLibrary}>
              <Ionicons name="images" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Capture Button */}
            <View style={styles.captureButtonContainer}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>

            {/* Flash/Settings Button (placeholder for future) */}
            <View style={styles.placeholderButton} />
          </View>
        </View>
      </PinchGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomControls: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -60 }],
    alignItems: 'center',
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  zoomIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginVertical: 10,
  },
  zoomText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  libraryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  placeholderButton: {
    width: 60,
    height: 60,
    // Empty placeholder to balance the layout
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FF6B35',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B35',
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
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    fontSize: 16,
    color: '#fff',
  },
});
import React from "react";
import { View, Text } from "react-native";
import { Camera } from "expo-camera";

export default function TestCamera() {
  console.log("TestCamera loaded");
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>TestCamera is rendering</Text>
      <Text>{JSON.stringify(Camera.Constants)}</Text>
    </View>
  );
}

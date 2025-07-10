import React from "react";
import { View } from "react-native";

interface SpacerProps {
  height?: number;
}

export const Spacer: React.FC<SpacerProps> = ({ height = 10 }) => {
  return <View style={{ height }} />;
};

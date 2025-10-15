import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  name: string;
  quantity: number;
};

const ItemRow: React.FC<Props> = ({ name, quantity }) => {
  return (
    <View style={styles.container}>
      {/* Left side: Item info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.qty}>Qty: {quantity}</Text>
      </View>
    </View>
  );
};

export default ItemRow;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  info: { flexShrink: 1 },
  name: { fontSize: 16, fontWeight: "600" },
  qty: { fontSize: 14, color: "#666", marginTop: 2 },
  actions: { flexDirection: "row", gap: 8 },
  iconButton: {
    padding: 4,
  },
});

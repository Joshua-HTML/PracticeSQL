import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import {
  fetchItems,
  insertItem,
  deleteItem,
  updateItem,
  type Item,
} from "../data/db";
import ItemRow from "./components/ItemRow";

export default function App() {
  const db = useSQLiteContext();
  const [name, setName] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [sortOption, setSortOption] = useState<string>("name-asc");

  const sortItems = (itemsToSort: Item[], option: string): Item[] => {
    const sorted = [...itemsToSort];
    switch (option) {
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "quantity-asc":
        return sorted.sort((a, b) => a.quantity - b.quantity);
      case "quantity-desc":
        return sorted.sort((a, b) => b.quantity - a.quantity);
      default:
        return sorted;
    }
  };

  const loadItems = async () => {
    try {
      const value = await fetchItems(db);
      setItems(sortItems(value, sortOption));
    } catch (err) {
      console.log("Failed to fetch items", err);
    }
  };

  // Accept null (iOS picker may pass null when cancelling)
  const handleSortChange = (option: string | null) => {
    if (option == null) return;
    setSortOption(option);
    setItems(sortItems(items, option));
  };

  useEffect(() => {
    loadItems();
  }, []);

  const saveOrUpdate = async () => {
    if (!name.trim()) return;
    const parsedQuantity = parseInt(quantity, 10);
    if (Number.isNaN(parsedQuantity)) return;
    try {
      if (editingId === null) {
        await insertItem(db, name.trim(), parsedQuantity);
      } else {
        await updateItem(db, editingId, name.trim(), parsedQuantity);
      }
      await loadItems();
      setName("");
      setQuantity("");
      setEditingId(null);
    } catch (err) {
      console.log("Failed to save/update item", err);
    }
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setName(item.name);
    setQuantity(String(item.quantity));
  };

  const confirmDelete = (id: number) => {
    Alert.alert("Delete item?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteItem(db, id);
            await loadItems();
            if (editingId === id) {
              setEditingId(null);
              setName("");
              setQuantity("");
            }
          } catch (err) {
            console.log("Failed to delete item", err);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SQLite Example</Text>

      <TextInput
        style={styles.input}
        placeholder="Item Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Quantity"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />

      <Button
        title={editingId === null ? "Save Item" : "Update Item"}
        onPress={saveOrUpdate}
      />

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.pickerContainer}>
          <RNPickerSelect
            onValueChange={(value) => handleSortChange(value)}
            value={sortOption}
            placeholder={{}} // keep no placeholder so current value shows
            items={[
              { label: "Name A-Z", value: "name-asc" },
              { label: "Name Z-A", value: "name-desc" },
              { label: "Qty Low-High", value: "quantity-asc" },
              { label: "Qty High-Low", value: "quantity-desc" },
            ]}
            style={pickerSelectStyles}
            useNativeAndroidPickerStyle={false}
            doneText="Done"
            onDonePress={() => {}}
          />
        </View>
      </View>

      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 1,
              backgroundColor: "#eee",
              marginLeft: 14,
              marginRight: 14,
            }}
          />
        )}
        renderItem={({ item }) => (
          <ItemRow
            name={item.name}
            quantity={item.quantity}
            onEdit={() => startEdit(item)}
            onDelete={() => confirmDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 24, color: "#888" }}>
            No items yet. Add your first one above.
          </Text>
        }
        contentContainerStyle={
          items.length === 0
            ? { flexGrow: 1, justifyContent: "center" }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  sortContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  sortLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 10,
  },
  pickerContainer: {
    flex: 1,
  },
  list: {
    marginTop: 20,
    width: "100%",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    color: "black",
    backgroundColor: "white",
    paddingRight: 30,
    minHeight: 44, // ensure tappable area on iOS
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    color: "black",
    backgroundColor: "white",
    paddingRight: 30,
  },
  iconContainer: {
    top: 10,
    right: 12,
  },
});

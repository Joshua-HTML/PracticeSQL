import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { fetchItems, insertItem,deleteItem,updateItem, type Item } from "../data/db";
import ItemRow from "./components/ItemRow";

export default function App() {
  /**
   * Database Access
   *
   * useSQLiteContext() hook gives us access to the database instance.
   * This works because _layout.tsx wraps the app in SQLiteProvider.
   * Without the provider, this hook would throw an error.
   */
  const db = useSQLiteContext();

  /**
   * Form State
   *
   * These state variables control the input fields (controlled components).
   * They're stored as strings because TextInput always works with strings.
   */
  const [name, setName] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);

  /**
   * Database State
   *
   * Stores the items retrieved from the database.
   * When this updates, React re-renders the FlatList to show the new data.
   */
  const [items, setItems] = useState<Item[]>([]);

  /**
   * Load Items on Mount
   *
   * useEffect with empty dependency array [] runs once when component mounts.
   * This is the perfect place to load initial data from the database.
   *
   * Note: VSCode may warn about missing 'loadItems' dependency.
   * We intentionally omit it because we only want this to run once on mount,
   * not every time loadItems function is redefined.
   */
  useEffect(() => {
    loadItems();
  }, []);

  /**
   * Load Items Function
   *
   * Fetches all items from the database and updates the local `items` state.
   *
   * This function is called when the component first mounts (via useEffect)
   * and whenever data changes (after an insert, update, or delete operation).
   *
   * The fetched data is stored in state so the FlatList automatically re-renders
   * to reflect the latest information from the database.
   *
   * @returns Promise that resolves when items are successfully loaded
   */
  const loadItems = async () => {
    try {
      const value = await fetchItems(db);
      setItems(value);
    } catch (err) {
      console.log("Failed to fetch items", err);
    }
  };

  /**
   * Save Item Function
   *
   * Validates user input and saves a new item to the database.
   *
   * Validation Steps:
   * 1. Check name isn't empty (trim() removes whitespace)
   * 2. Parse quantity string to integer (base 10)
   * 3. Check that quantity is a valid number (not NaN)
   *
   * After successful insert:
   * - Reload items to show the new entry
   * - Clear the form fields for the next entry
   */
  const saveItem = async () => {
    // Validate name is not empty or just whitespace
    if (!name.trim()) return;
   
    // Validate quantity is a valid number
    const parsedQuantity = parseInt(quantity, 10);
    if (Number.isNaN(parsedQuantity)) return;

    try {
      await insertItem(db, name, parsedQuantity);
      await loadItems(); // Refresh the list to show the new item

      // Clear form fields
      setName("");
      setQuantity("");
    } catch (err) {
      console.log("Failed to save item");
      console.log(err);
    }
  };

 /**
   * Save or Update Item Function
   *
   * Validates user input, then either inserts a new record or updates
   * an existing record depending on whether `editingId` is null.
   *
   * Validation Steps:
   * 1. Ensure the name is not empty (after trimming whitespace)
   * 2. Parse quantity as an integer
   * 3. Ensure quantity is a valid number (not NaN)
   *
   * Workflow:
   * - If no item is being edited (editingId is null), insert a new item.
   * - If an item is being edited, update that record in the database.
   *
   * After successful operation:
   * - The list of items is refreshed from the database
   * - Form fields and editing state are cleared
   *
   * @returns Promise that resolves when the save or update completes
   */
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

  /**
   * Start Edit Function
   *
   * Prepares the form for editing an existing item.
   *
   * When a user taps the "Edit" button, this function:
   * - Saves the selected item's `id` in state (editingId)
   * - Populates the input fields (`name` and `quantity`)
   *   so the user can modify existing values
   *
   * Once editing is complete and the user taps "Update Item",
   * the `saveOrUpdate` function will handle saving the changes.
   *
   * @param item - The item object that the user selected to edit
   * @returns void
   */
  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setName(item.name);
    setQuantity(String(item.quantity));
  };

  /**
   * Confirm Delete Function
   *
   * Displays a confirmation dialog before deleting an item from the database.
   *
   * Workflow:
   * 1. Shows an alert asking the user to confirm deletion.
   * 2. If the user confirms, deletes the item using its `id`.
   * 3. Reloads the item list to reflect the change.
   * 4. If the deleted item was currently being edited, clears the form.
   *
   * This confirmation step helps prevent accidental deletions.
   *
   * @param id - The unique identifier of the item to delete
   * @returns void
   */
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

      {/* 
        Quantity Input
        
        keyboardType="numeric" shows a number keyboard on mobile devices.
        Note: This doesn't prevent non-numeric input, so we still validate in saveItem().
      */}
      <TextInput
        style={styles.input}
        placeholder="Quantity"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />

      {/* 
        Save Button
        Triggers the saveOrUpdate function which validates and saves to database.
      */}
      <Button
        title={editingId === null ? "Save Item" : "Update Item"}
        onPress={saveOrUpdate}
      />
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
    justifyContent: "center",
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
  },
  list: {
    marginTop: 20,
    width: "100%",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});

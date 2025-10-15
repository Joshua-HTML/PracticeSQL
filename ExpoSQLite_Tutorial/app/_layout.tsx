import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { initDb } from "../data/db";

/**
 * Root Layout Component
 *
 * This is the entry point of the app. It wraps all screens with SQLiteProvider,
 * making the database accessible throughout the entire application.
 *
 * Key Props Explained:
 *
 * - databaseName="db.db"
 *   The filename for the SQLite database. It's stored locally on the device.
 *   You can name it anything, but .db extension is conventional.
 *
 * - onInit={initDb}
 *   Callback function that runs ONCE when the database is first opened.
 *   Perfect place to create tables and set up the database schema.
 *   This ensures the database is ready before any screens try to use it.
 *
 * Any child component can access the database using the useSQLiteContext() hook.
 */
export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="db.db" onInit={initDb}>
      <Stack />
    </SQLiteProvider>
  );
}

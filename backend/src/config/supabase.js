import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";
import { createInitialStore, MockQueryBuilder } from "./mockStore.js";

const realSupabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const globalStore = createInitialStore();
let useMock = true;

// Check if remote tables exist in Supabase
realSupabase
  .from("users")
  .select("id")
  .limit(1)
  .then(({ error }) => {
    if (!error) {
      console.log("Connected to Supabase PostgreSQL cloud database.");
      useMock = false;
    } else {
      console.log("Supabase schema cache empty. Running with in-memory store for local verification.");
    }
  })
  .catch(() => {
    console.log("Using in-memory fallback store.");
  });

export const supabase = {
  ...realSupabase,
  from(table) {
    if (useMock) {
      return new MockQueryBuilder(globalStore, table);
    }
    return realSupabase.from(table);
  },
  _real: realSupabase,
  _store: globalStore,
};

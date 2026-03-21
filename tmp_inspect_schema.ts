import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load .env.local from the project root
dotenv.config({ path: "d:/MrSure/guidematch/.env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  try {
    const { data, error } = await supabase.from("tours").select("*").limit(1);
    if (error) {
      console.error("Error fetching from tours:", error);
      return;
    }
    if (data && data.length > 0) {
      console.log("Tours Columns:", Object.keys(data[0]));
    } else {
      console.log("No data in tours table.");
      // Try to get another table to verify connection
      const { data: profiles, error: pError } = await supabase.from("profiles").select("*").limit(1);
      if (profiles && profiles.length > 0) {
          console.log("Profiles Columns:", Object.keys(profiles[0]));
      }
    }
  } catch (e) {
      console.error("Execution error:", e);
  }
}
main();

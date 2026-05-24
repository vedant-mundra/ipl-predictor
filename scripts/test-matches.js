const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://euwyvgywckmwlzofotfv.supabase.co";
const supabaseKey = "sb_publishable_-yvOOWeg5cD8yy-RMO_cXw_Q1HRA4rT";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Listing matches...");
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("id", { ascending: true });
  if (error) {
    console.error("Error listing matches:", error);
  } else {
    console.log("Total matches in DB:", data.length);
    console.log("Last 10 matches in DB:", data.slice(-10));
  }
}

run();

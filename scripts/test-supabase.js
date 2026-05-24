const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://euwyvgywckmwlzofotfv.supabase.co";
const supabaseKey = "sb_publishable_-yvOOWeg5cD8yy-RMO_cXw_Q1HRA4rT";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking Supabase connection and tables...");

  // 1. Check profiles
  const { data: profiles, error: pError } = await supabase.from("profiles").select("*").limit(2);
  console.log("Profiles check:", { success: !pError, count: profiles?.length, error: pError });

  // 2. Check results
  const { data: results, error: rError } = await supabase.from("results").select("*").limit(2);
  console.log("Results check:", { success: !rError, count: results?.length, error: rError });

  // 3. Try to select from "matches"
  const { data: matches, error: plError } = await supabase.from("matches").select("*").limit(2);
  console.log("matches check:", { success: !plError, count: matches?.length, data: matches, error: plError });
  
  // 4. Try to select from "champion_predictions"
  const { data: champPreds, error: cError } = await supabase.from("champion_predictions").select("*").limit(2);
  console.log("champion_predictions check:", { success: !cError, count: champPreds?.length, error: cError });
}

run();

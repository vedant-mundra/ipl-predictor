const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://euwyvgywckmwlzofotfv.supabase.co";
const supabaseKey = "sb_publishable_-yvOOWeg5cD8yy-RMO_cXw_Q1HRA4rT";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Testing matches table insert...");
  const { data, error } = await supabase
    .from("matches")
    .insert([
      { id: 71, team1: "TBD", team2: "TBD", match_time: "2026-05-26T19:30:00", venue: "TBD", winner: null }
    ]);
  console.log("Matches insert check:", { success: !error, error, data });
}

run();

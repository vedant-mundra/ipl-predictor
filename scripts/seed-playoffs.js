const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://euwyvgywckmwlzofotfv.supabase.co";
const supabaseKey = "sb_publishable_-yvOOWeg5cD8yy-RMO_cXw_Q1HRA4rT";
const supabase = createClient(supabaseUrl, supabaseKey);

const playoffs = [
  { id: 71, team1: "TBD", team2: "TBD", match_time: "2026-05-26T19:30:00", venue: "Ahmedabad", winner: null },
  { id: 72, team1: "TBD", team2: "TBD", match_time: "2026-05-27T19:30:00", venue: "Ahmedabad", winner: null },
  { id: 73, team1: "TBD", team2: "TBD", match_time: "2026-05-29T19:30:00", venue: "Chennai", winner: null },
  { id: 74, team1: "TBD", team2: "TBD", match_time: "2026-05-31T19:30:00", venue: "Chennai", winner: null }
];

async function run() {
  console.log("Seeding playoff matches in matches table...");
  for (const match of playoffs) {
    const { data, error } = await supabase
      .from("matches")
      .upsert(match, { onConflict: "id" });
    if (error) {
      console.error(`Error upserting match ${match.id}:`, error);
    } else {
      console.log(`Successfully upserted match ${match.id}`);
    }
  }
}

run();

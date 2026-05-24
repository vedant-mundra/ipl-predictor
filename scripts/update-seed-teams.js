const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://euwyvgywckmwlzofotfv.supabase.co";
const supabaseKey = "sb_publishable_-yvOOWeg5cD8yy-RMO_cXw_Q1HRA4rT";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Updating seed teams for Match 71 and 72...");
  
  // Q1: RCB vs GT
  const { error: error71 } = await supabase
    .from("matches")
    .update({ team1: "RCB", team2: "GT" })
    .eq("id", 71);

  // Eliminator: SRH vs RR
  const { error: error72 } = await supabase
    .from("matches")
    .update({ team1: "SRH", team2: "RR" })
    .eq("id", 72);

  console.log("Match 71 Update:", { success: !error71, error: error71 });
  console.log("Match 72 Update:", { success: !error72, error: error72 });
}

run();

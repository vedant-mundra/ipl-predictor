const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://euwyvgywckmwlzofotfv.supabase.co";
const supabaseKey = "sb_publishable_-yvOOWeg5cD8yy-RMO_cXw_Q1HRA4rT";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Updating playoff venues in DB matches table...");

  const updates = [
    { id: 71, venue: "Himachal Pradesh Cricket Association Stadium, Dharamshala" },
    { id: 72, venue: "New International Cricket Stadium, New Chandigarh" },
    { id: 73, venue: "New International Cricket Stadium, New Chandigarh" },
    { id: 74, venue: "Narendra Modi Stadium, Ahmedabad" }
  ];

  for (const item of updates) {
    const { error } = await supabase
      .from("matches")
      .update({ venue: item.venue })
      .eq("id", item.id);
    console.log(`Match ${item.id} venue update:`, { success: !error, error });
  }
}

run();

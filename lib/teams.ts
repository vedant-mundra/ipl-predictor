export const TEAM_CONFIG: Record<
  string,
  {
    primary: string;
    secondary: string;
    gradient: string;
    textColor: string;
    emoji: string;
    logo: string;
    shortCode: string;
  }
> = {
  "Royal Challengers Bengaluru": {
    primary: "#EC1C24",
    secondary: "#1A1A2E",
    gradient: "from-red-700 to-red-900",
    textColor: "text-red-400",
    emoji: "🔴",
    shortCode: "RCB",
    logo: "https://upload.wikimedia.org/wikipedia/en/d/d4/Royal_Challengers_Bengaluru_Logo.svg",
  },
  "Mumbai Indians": {
    primary: "#004BA0",
    secondary: "#002D72",
    gradient: "from-blue-700 to-blue-900",
    textColor: "text-blue-400",
    emoji: "🔵",
    shortCode: "MI",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/cd/Mumbai_Indians_Logo.svg",
  },
  "Chennai Super Kings": {
    primary: "#FDB913",
    secondary: "#0C2340",
    gradient: "from-yellow-500 to-yellow-700",
    textColor: "text-yellow-400",
    emoji: "🟡",
    shortCode: "CSK",
    logo: "https://upload.wikimedia.org/wikipedia/en/2/2b/Chennai_Super_Kings_Logo.svg",
  },
  "Kolkata Knight Riders": {
    primary: "#A855F7",
    secondary: "#FFC107",
    gradient: "from-purple-500 to-purple-800",
    textColor: "text-purple-400",
    emoji: "🟣",
    shortCode: "KKR",
    logo: "https://upload.wikimedia.org/wikipedia/en/4/4c/Kolkata_Knight_Riders_Logo.svg",
  },
  "Sunrisers Hyderabad": {
    primary: "#FF822A",
    secondary: "#1A1A2E",
    gradient: "from-orange-500 to-orange-700",
    textColor: "text-orange-400",
    emoji: "🟠",
    shortCode: "SRH",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/51/Sunrisers_Hyderabad_Logo.svg",
  },
  "Rajasthan Royals": {
    primary: "#E91E8C",
    secondary: "#1A1A2E",
    gradient: "from-pink-600 to-pink-800",
    textColor: "text-pink-400",
    emoji: "🩷",
    shortCode: "RR",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/5c/This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg",
  },
  "Punjab Kings": {
    primary: "#FF6348",
    secondary: "#A7A9AC",
    gradient: "from-orange-500 to-red-600",
    textColor: "text-orange-300",
    emoji: "🦁",
    shortCode: "PBKS",
    logo: "https://upload.wikimedia.org/wikipedia/en/d/d4/Punjab_Kings_Logo.svg",
  },
  "Gujarat Titans": {
    primary: "#06B6D4",
    secondary: "#1C2B5E",
    gradient: "from-cyan-400 to-cyan-700",
    textColor: "text-cyan-400",
    emoji: "🩵",
    shortCode: "GT",
    logo: "https://upload.wikimedia.org/wikipedia/en/0/09/Gujarat_Titans_Logo.svg",
  },
  "Lucknow Super Giants": {
    primary: "#A3E4F4",
    secondary: "#004F88",
    gradient: "from-sky-500 to-sky-700",
    textColor: "text-sky-400",
    emoji: "🌀",
    shortCode: "LSG",
    logo: "https://upload.wikimedia.org/wikipedia/en/3/34/Lucknow_Super_Giants_Logo.svg",
  },
  "Delhi Capitals": {
    primary: "#0078BC",
    secondary: "#EF1C25",
    gradient: "from-blue-600 to-blue-800",
    textColor: "text-blue-300",
    emoji: "💙",
    shortCode: "DC",
    logo: "https://upload.wikimedia.org/wikipedia/en/2/2f/Delhi_Capitals.svg",
  },
};

export const SHORT_TO_FULL: Record<string, string> = {
  RCB: "Royal Challengers Bengaluru",
  MI: "Mumbai Indians",
  CSK: "Chennai Super Kings",
  KKR: "Kolkata Knight Riders",
  SRH: "Sunrisers Hyderabad",
  RR: "Rajasthan Royals",
  PBKS: "Punjab Kings",
  GT: "Gujarat Titans",
  LSG: "Lucknow Super Giants",
  DC: "Delhi Capitals",
};

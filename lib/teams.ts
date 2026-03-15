export const TEAM_CONFIG: Record<
  string,
  { primary: string; secondary: string; gradient: string; textColor: string; emoji: string }
> = {
  "Royal Challengers Bengaluru": {
    primary: "#EC1C24",
    secondary: "#1A1A2E",
    gradient: "from-red-700 to-red-900",
    textColor: "text-red-400",
    emoji: "🔴",
  },
  "Mumbai Indians": {
    primary: "#004BA0",
    secondary: "#002D72",
    gradient: "from-blue-700 to-blue-900",
    textColor: "text-blue-400",
    emoji: "🔵",
  },
  "Chennai Super Kings": {
    primary: "#FDB913",
    secondary: "#0C2340",
    gradient: "from-yellow-500 to-yellow-700",
    textColor: "text-yellow-400",
    emoji: "🟡",
  },
  "Kolkata Knight Riders": {
    primary: "#A855F7",
    secondary: "#FFC107",
    gradient: "from-purple-500 to-purple-800",
    textColor: "text-purple-400",
    emoji: "🟣",
  },
  "Sunrisers Hyderabad": {
    primary: "#FF822A",
    secondary: "#1A1A2E",
    gradient: "from-orange-500 to-orange-700",
    textColor: "text-orange-400",
    emoji: "🟠",
  },
  "Rajasthan Royals": {
    primary: "#E91E8C",
    secondary: "#1A1A2E",
    gradient: "from-pink-600 to-pink-800",
    textColor: "text-pink-400",
    emoji: "🩷",
  },
  "Punjab Kings": {
    primary: "#FF6348",
    secondary: "#A7A9AC",
    gradient: "from-orange-500 to-red-600",
    textColor: "text-orange-300",
    emoji: "🦁",
  },
  "Gujarat Titans": {
    primary: "#06B6D4",
    secondary: "#1C2B5E",
    gradient: "from-cyan-400 to-cyan-700",
    textColor: "text-cyan-400",
    emoji: "🩵",
  },
  "Lucknow Super Giants": {
    primary: "#A3E4F4",
    secondary: "#004F88",
    gradient: "from-sky-500 to-sky-700",
    textColor: "text-sky-400",
    emoji: "🌀",
  },
  "Delhi Capitals": {
    primary: "#0078BC",
    secondary: "#EF1C25",
    gradient: "from-blue-600 to-blue-800",
    textColor: "text-blue-300",
    emoji: "💙",
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

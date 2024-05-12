import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {   
     colors: {
      primary: "#FFFFFF",
      primaryLight: "#FBFBFB",
      primaryDark: "#1E1E1E",
      redLight: "#F83941",
      redDark: "#D91A23",
      gray: "#232E35",
      grayMedium: "#656D72",
      grayLight: "#D9D9D9", 
      whiteBasic: " #F5F3FE",
      whiteTextDarkMode: "#F1F1F1",
      secondaryDark: "#131313",
    },
    gridTemplateColumns: {
      charactersCards: "repeat(auto-fit, minmax(250px, 1fr))",
    },
  },
  },
  plugins: [],
} satisfies Config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#08111a",
        mist: "#edf4f7",
        sky: "#6bd5ff",
        tide: "#13b497",
        ember: "#ff8059"
      },
      boxShadow: {
        panel: "0 20px 50px rgba(8, 17, 26, 0.12)"
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(8,17,26,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(8,17,26,0.05) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;

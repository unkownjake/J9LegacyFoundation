import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  /* 
  Within theme we can add in classes of our own. This can be custom colors or stylings we want to be
  added in like other tailwind properties. 

  Ex. Wanting to create / add a new color:

  colors: {
    "twitter blue": "#1DA1F2"
  }

  This can now be referenced by the calssname "twitter-blue"
  */
 
  theme: {

    extend: {
    },
  },
  plugins: [],
} satisfies Config;

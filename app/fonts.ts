import localFont from "next/font/local";

export const thmanyahSans = localFont({
  src: [
    {
      path: "./fonts/thmanyah-sans-light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/thmanyah-sans-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/thmanyah-sans-medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/thmanyah-sans-bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/thmanyah-sans-black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-thmanyah-sans",
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

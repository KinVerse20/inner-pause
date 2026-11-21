import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Inner Pause",
    short_name: "Inner Pause",
    description: "Pause the noise. Return to you.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f3ec",
    theme_color: "#f8f3ec",
    orientation: "portrait",
    categories: ["health", "lifestyle"],
    shortcuts: [
      { name: "Start a Pause", short_name: "Pause", url: "/?open=pause", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Today's Practice", short_name: "Practice", url: "/?open=practice", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

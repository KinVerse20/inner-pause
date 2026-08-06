import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The InnerPause",
    short_name: "The InnerPause",
    description: "Guided reflective expression, emotional insight and personalised reset sessions.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f4ff",
    theme_color: "#f8f4ff",
    orientation: "portrait",
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

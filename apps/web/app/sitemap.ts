import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://applypilot.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "", priority: 1.0, changeFrequency: "weekly" },
    { path: "/dashboard", priority: 0.9, changeFrequency: "daily" },
    { path: "/jobs", priority: 0.9, changeFrequency: "daily" },
    { path: "/applications", priority: 0.8, changeFrequency: "daily" },
    { path: "/studio", priority: 0.8, changeFrequency: "weekly" },
    { path: "/profile", priority: 0.8, changeFrequency: "weekly" },
    { path: "/copilot", priority: 0.7, changeFrequency: "weekly" },
    { path: "/settings", priority: 0.6, changeFrequency: "monthly" },
    { path: "/login", priority: 0.5, changeFrequency: "monthly" },
    { path: "/signup", priority: 0.6, changeFrequency: "monthly" },
    { path: "/sitemap", priority: 0.4, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}


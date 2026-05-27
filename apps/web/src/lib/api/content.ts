import type { Content } from "@kairo/types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function getContentById(id: string): Promise<Content | null> {
  try {
    const res = await fetch(`${API_URL}/api/content/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<Content>;
  } catch {
    return null;
  }
}

export async function getFeaturedContent(): Promise<Content[]> {
  try {
    const res = await fetch(`${API_URL}/api/content?featured=true&limit=5`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json() as Promise<Content[]>;
  } catch {
    return [];
  }
}

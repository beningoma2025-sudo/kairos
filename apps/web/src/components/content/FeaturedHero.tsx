import { getFeatured, getContentList } from "@/lib/data/content";
import { FeaturedHeroClient } from "./FeaturedHeroClient";

export async function FeaturedHero() {
  let items = await getFeatured(6);
  // Fallback: if no featured content is marked, use the 6 newest published videos
  if (items.length === 0) {
    items = await getContentList({ sort: "newest", limit: 6 });
  }
  return <FeaturedHeroClient items={items} />;
}

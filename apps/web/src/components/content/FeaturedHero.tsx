import { getFeatured } from "@/lib/data/content";
import { FeaturedHeroClient } from "./FeaturedHeroClient";

export async function FeaturedHero() {
  const items = await getFeatured(6);
  return <FeaturedHeroClient items={items} />;
}

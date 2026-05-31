const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE  = "https://image.tmdb.org/t/p";

export interface TMDBResult {
  posterUrl:   string | null;   // w500 poster (2:3 portrait)
  backdropUrl: string | null;   // w1280 backdrop (16:9)
  overview:    string | null;
  releaseYear: number | null;
  tmdbId:      number;
  mediaType:   "movie" | "tv";
}

function apiKey(): string | null {
  return process.env.TMDB_API_KEY ?? null;
}

/** Search TMDB for a title. Returns best match or null. */
export async function searchTMDB(
  title: string,
  year?: number | null,
): Promise<TMDBResult | null> {
  const key = apiKey();
  if (!key) return null;

  try {
    const params = new URLSearchParams({
      api_key: key,
      query:   title,
      language: "en-US",
      page:    "1",
      ...(year ? { year: String(year) } : {}),
    });

    const res = await fetch(`${TMDB_BASE}/search/multi?${params}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data: {
      results: {
        id: number;
        media_type: string;
        poster_path: string | null;
        backdrop_path: string | null;
        overview: string;
        release_date?: string;
        first_air_date?: string;
      }[];
    } = await res.json();

    const hit = data.results?.find(
      (r) => r.media_type === "movie" || r.media_type === "tv",
    );
    if (!hit) return null;

    const yearStr = hit.release_date ?? hit.first_air_date ?? "";
    const releaseYear = yearStr ? parseInt(yearStr.slice(0, 4), 10) : null;

    return {
      posterUrl:   hit.poster_path   ? `${IMG_BASE}/w500${hit.poster_path}`   : null,
      backdropUrl: hit.backdrop_path ? `${IMG_BASE}/w1280${hit.backdrop_path}` : null,
      overview:    hit.overview      || null,
      releaseYear: isNaN(releaseYear!) ? null : releaseYear,
      tmdbId:      hit.id,
      mediaType:   hit.media_type === "tv" ? "tv" : "movie",
    };
  } catch {
    return null;
  }
}

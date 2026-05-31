export interface Video {
  id: string;
  title: string;
  poster: string;
  videoUrl: string;
  year?: number;
  duration?: string;
  rating?: string;
  genre?: string;
  leavingSoon?: boolean;
}

export interface Section {
  title: string;
  href?: string;
  videos: Video[];
}

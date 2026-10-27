export interface VideoConfig {
  src: string;
  poster: string;
  aspect: number;
}

export const HERO_VIDEO_CONFIG: VideoConfig = {
  src: '/videos/hero.mp4',
  poster: '/videos/hero-poster.jpg',
  aspect: 1920 / 800,
};

export const VILLAIN_VIDEO_CONFIG: VideoConfig = {
  src: '/videos/villain.mp4',
  poster: '/videos/villain-poster.jpg',
  aspect: 1920 / 1080,
};

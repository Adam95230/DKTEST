export interface TrackInfo {
  id: string;
  title: string;
  author: string;
  duration: number;
}

export interface InstanceInfo {
  name: string;
  message: string;
  link: string;
}

export interface PlayerState {
  currentTrack: TrackInfo | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  queue: string[];
  currentIndex: number;
}


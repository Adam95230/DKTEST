import React from 'react';
import { api } from '../services/api';
import type { TrackInfo } from '../types';
import './TrackLockup.css';

interface TrackLockupProps {
  track: TrackInfo;
  onClick?: () => void;
}

export const TrackLockup: React.FC<TrackLockupProps> = ({ track, onClick }) => {
  return (
    <div className="track-lockup" onClick={onClick}>
      <div className="track-lockup__artwork">
        <picture className="artwork-picture">
          <img
            alt={track.title}
            className="artwork-component__contents artwork-component__image"
            loading="lazy"
            src={api.getTrackCoverUrl(track.id, 296)}
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="296" height="296"><rect fill="%23ebebeb" width="296" height="296"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="%23999" font-size="48">♪</text></svg>';
            }}
          />
        </picture>
      </div>
      <div className="track-lockup__metadata">
        <div className="track-lockup__title">{track.title}</div>
        <div className="track-lockup__artist">{track.author}</div>
      </div>
    </div>
  );
};

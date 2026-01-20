import React from 'react';
import './EditorialCard.css';

interface EditorialCardProps {
  title: string;
  description?: string;
  imageUrl: string;
  onClick?: () => void;
}

export const EditorialCard: React.FC<EditorialCardProps> = ({ title, description, imageUrl, onClick }) => {
  return (
    <div className="editorial-card-wrapper" onClick={onClick}>
      <div className="editorial-card">
        <div className="editorial-card__artwork">
          <picture className="artwork-picture">
            <img
              alt={title}
              className="artwork-component__contents artwork-component__image"
              loading="lazy"
              src={imageUrl}
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="530" height="303"><rect fill="%23ebebeb" width="530" height="303"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="%23999" font-size="48">♪</text></svg>';
              }}
            />
          </picture>
        </div>
        {description && (
          <div className="editorial-card__artwork-description">
            <div className="editorial-card__artwork-description-text">{description}</div>
          </div>
        )}
      </div>
    </div>
  );
};

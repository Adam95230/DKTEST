import React from 'react';
import './TopPickCard.css';

interface TopPickCardProps {
  title: string;
  subtitle: string;
  color: 'blue' | 'orange' | 'dark-blue' | 'red' | 'purple' | 'green';
  image?: string;
  badge?: string;
}

export const TopPickCard: React.FC<TopPickCardProps> = ({ title, subtitle, color, image, badge = 'Music' }) => {
  return (
    <div className={`top-pick-card ${color}`}>
      {image && <img src={image} alt={title} className="top-pick-image" />}
      <div className="top-pick-badge">
        <svg className="top-pick-badge-icon" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.25 0.5C1.42157 0.5 0.75 1.17157 0.75 2V10C0.75 10.8284 1.42157 11.5 2.25 11.5H9.75C10.5784 11.5 11.25 10.8284 11.25 10V2C11.25 1.17157 10.5784 0.5 9.75 0.5H2.25ZM6 2.5C6.41421 2.5 6.75 2.83579 6.75 3.25V5.5H9C9.41421 5.5 9.75 5.83579 9.75 6.25C9.75 6.66421 9.41421 7 9 7H6.75V9.25C6.75 9.66421 6.41421 10 6 10C5.58579 10 5.25 9.66421 5.25 9.25V7H3C2.58579 7 2.25 6.66421 2.25 6.25C2.25 5.83579 2.58579 5.5 3 5.5H5.25V3.25C5.25 2.83579 5.58579 2.5 6 2.5Z"></path>
        </svg>
        <span className="top-pick-badge-text">{badge}</span>
      </div>
      <div className="top-pick-content">
        <h3 className="top-pick-title">{title}</h3>
        <p className="top-pick-subtitle">{subtitle}</p>
      </div>
    </div>
  );
};

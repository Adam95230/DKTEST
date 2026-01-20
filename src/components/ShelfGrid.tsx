import React, { useRef, useState } from 'react';
import './ShelfGrid.css';

interface ShelfGridProps {
  title: string;
  children: React.ReactNode;
  type?: 'grid-type-A' | 'grid-type-TrackLockupsShelf';
  rows?: number;
}

export const ShelfGrid: React.FC<ShelfGridProps> = ({ title, children, type = 'grid-type-A', rows = 1 }) => {
  const scrollRef = useRef<HTMLUListElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="shelf-grid">
      <div className="shelf-grid__header">
        <h2 className="shelf-grid__title">{title}</h2>
      </div>
      <div className="shelf-grid__body">
        {showLeftArrow && (
          <button
            className="shelf-grid-nav__arrow shelf-grid-nav__arrow--left"
            onClick={() => scroll('left')}
            aria-label="Page précédente"
            type="button"
          >
            <svg viewBox="0 0 9 31" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.275 29.46a1.61 1.61 0 0 0 1.456 1.077c1.018 0 1.772-.737 1.772-1.737 0-.526-.277-1.186-.449-1.62l-4.68-11.912L8.05 3.363c.172-.442.45-1.116.45-1.625A1.702 1.702 0 0 0 6.728.002a1.603 1.603 0 0 0-1.456 1.09L.675 12.774c-.301.775-.677 1.744-.677 2.495 0 .754.376 1.705.677 2.498L5.272 29.46Z"></path>
            </svg>
          </button>
        )}
        <ul
          ref={scrollRef}
          className={`shelf-grid__list shelf-grid__list--${type} shelf-grid__list--grid-rows-${rows}`}
          role="list"
          tabIndex={-1}
          onScroll={handleScroll}
        >
          {React.Children.map(children, (child, index) => (
            <li key={index} className="shelf-grid__list-item" data-index={index}>
              {child}
            </li>
          ))}
        </ul>
        {showRightArrow && (
          <button
            className="shelf-grid-nav__arrow shelf-grid-nav__arrow--right"
            onClick={() => scroll('right')}
            aria-label="Page suivante"
            type="button"
          >
            <svg viewBox="0 0 9 31" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.275 29.46a1.61 1.61 0 0 0 1.456 1.077c1.018 0 1.772-.737 1.772-1.737 0-.526-.277-1.186-.449-1.62l-4.68-11.912L8.05 3.363c.172-.442.45-1.116.45-1.625A1.702 1.702 0 0 0 6.728.002a1.603 1.603 0 0 0-1.456 1.09L.675 12.774c-.301.775-.677 1.744-.677 2.495 0 .754.376 1.705.677 2.498L5.272 29.46Z"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

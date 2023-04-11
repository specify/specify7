import React from 'react';
import ContentLoader from 'react-content-loader';
import { userPreferences } from '../Preferences/userPreferences';

const DEFAULT_FETCH_LIMIT = 20;

export function AttachmentGallerySkeleton(): JSX.Element {
  const [motionPref] = userPreferences.use('general', 'ui', 'reduceMotion');

  function createRectangles() {
    const rectWidth = 22;
    const rectHeight = 22;
    const rectRadius = 2;
    let rectX = 5; // starting x position
    let rectY = 0; // starting y position
    let rectangles = []; // array to hold the generated rectangles

    for (let i = 0; i < DEFAULT_FETCH_LIMIT; i++) {
      rectangles.push(
        <rect
          x={rectX}
          y={rectY}
          rx={rectRadius}
          ry={rectRadius}
          width={rectWidth}
          height={rectHeight}
        />
      );

      rectX += rectWidth + 5;

      if ((i + 1) % 4 === 0) {
        rectX = 5;
        rectY += rectHeight + 10;
      }
    }

    return rectangles;
  }

  return (
    <div className="h-full w-full">
      <ContentLoader
        viewBox="0 0 115 150"
        backgroundColor={'#333'}
        foregroundColor={'#999'}
        speed={3}
        animate={motionPref === 'reduce' ? false : true}
      >
        {createRectangles()}
      </ContentLoader>
    </div>
  );
}

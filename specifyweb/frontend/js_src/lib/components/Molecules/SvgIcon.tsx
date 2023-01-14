import React from 'react';
import { useId } from '../../hooks/useId';
import { RR } from '../../utils/types';
import { Tables } from '../DataModel/types';
import { stringToColor } from './TableIcon';

export function SvgIcon({
  name,
  className,
}: {
  readonly name: keyof Tables;
  readonly className: string;
}) {
  const shortName = nameMapper[name] ?? name.slice(0, 2).toUpperCase();
  const [from, to] = colorMapper[name] ?? [
    stringToColor(shortName),
    stringToColor(shortName),
  ];
  const id = useId('icon');
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 1000"
      className={className}
    >
      <g>
        <radialGradient
          id={id('gradient')}
          cx="512.8199"
          cy="2.0972"
          r="1190.8768"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" style={{ stopColor: from }} />
          <stop offset="1" style={{ stopColor: to }} />
        </radialGradient>
        <path
          fill={`url(#${id('gradient')})`}
          d="M500,0c53.8,0.7,107.6,0.9,161.4,2.4c51.6,1.4,103,5.1,153.2,18.4c57.7,15.3,104.7,45.7,136.6,97.1
		c19.9,32.1,30.1,67.7,36.5,104.5c9.3,53.9,11.4,108.3,11.6,162.8c0.3,92.3,0,184.7-1.3,277c-0.7,49.8-4.8,99.5-17,148.1
		c-15.2,60.4-46.1,109.8-100.4,142.6c-31.5,19.1-66.2,29.1-102.2,35.2c-60.2,10.3-121.1,11.8-182,11.9
		c-85.9,0.1-171.8-0.2-257.7-1.5c-49.1-0.7-98.1-4.8-146.1-16.6C97.9,958.9,40.1,899.6,17.8,805.2C9,768,4.8,730.1,3.2,692.1
		c-5-119.8-4.1-239.6-1.1-359.3c1.3-50.9,5.5-101.7,19.4-151.1c24.6-87.2,81.8-140.4,169-162.3C239.1,7.2,288.8,3.6,338.6,2.3
		C392.4,0.9,446.2,0.7,500,0z"
        />
      </g>
      <g>
        <text
          fill="#FFFFFF"
          transform="matrix(1 0 0 1 115.2803 789.2119)"
          fontFamily="Francois One"
          fontSize={`700px`}
        >
          {shortName}
        </text>
      </g>
    </svg>
  );
}

const nameMapper: Partial<RR<keyof Tables, string>> = {
  Taxon: 'Tax',
};

const colorMapper: RR<keyof Tables, readonly [from: string, to: string]> = {
  CollectionObject: ['#A67C52', '#754C24'],
};

import React from 'react';
import { userPreferences } from '../Preferences/userPreferences';

export const logoClassName = `text-brand-300 hover:animate-hue-rotate`;

export const logos = {
  shortSpecify: (
    <svg
      aria-hidden
      className={logoClassName}
      viewBox="0 0 142.34 142.32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style />
        <linearGradient
          gradientTransform="translate(0 143.9) scale(1 -1)"
          gradientUnits="userSpaceOnUse"
          id="b"
          x1="126.05"
          x2="142.54"
          y1="18.32"
          y2="1.83"
        >
          <stop offset="0" stopColor="currentColor" stopOpacity="1" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient
          gradientTransform="translate(0 143.9) scale(1 -1)"
          gradientUnits="userSpaceOnUse"
          id="c"
          x1="0"
          x2="95.35"
          y1="143.9"
          y2="48.54"
        >
          <stop offset="0" stopColor="currentColor" stopOpacity="1" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <path
        d="M110.26,142.3h32.04v-32.98c-6.73,14.21-18.05,25.84-32.04,32.98Z"
        fill="currentColor"
      />
      <path
        d="M6.69,78.87C6.69,39.54,38.58,7.65,77.91,7.65c28.44,0,52.97,16.67,64.38,40.76V0H0V142.31H45.56C22.5,130.53,6.69,106.56,6.69,78.87Z"
        fill="currentColor"
      />
      <g>
        <path
          d="M66.93,115.57c-3.27,1.17-7.13,1.76-11.58,1.76-13.76,0-22.61-6.5-26.55-19.51l5.16-1.76c2.94,10.74,10.07,16.11,21.4,16.11,6.46,0,11.54-1.59,15.23-4.78,3.78-3.27,5.66-8.05,5.66-14.35,0-5.96-2.22-10.91-6.67-14.85-1.18-1.09-2.98-2.31-5.41-3.65-2.43-1.34-5.54-2.85-9.31-4.53-7.13-3.19-12-5.96-14.6-8.31-4.36-3.78-6.54-8.77-6.54-14.98s2.22-11.2,6.67-14.98c4.36-3.86,9.73-5.79,16.11-5.79,10.57,0,18.04,3.94,22.4,11.83l-4.91,2.14c-1.68-2.77-3.69-4.82-6.04-6.17-2.94-1.84-6.75-2.77-11.45-2.77-4.95,0-9.06,1.38-12.33,4.15-3.52,2.94-5.29,6.8-5.29,11.58,0,4.28,1.84,8.01,5.54,11.2,2.1,1.68,6.29,3.95,12.58,6.8,3.94,1.76,7.34,3.5,10.19,5.22s5.16,3.46,6.92,5.22c4.86,4.78,7.3,10.74,7.3,17.87,0,11.41-4.83,18.92-14.47,22.53v.02Z"
          fill="currentColor"
        />
        <path
          d="M133.92,110.23c-5.2,5.2-11.58,7.8-19.13,7.8-8.64,0-15.77-3.52-21.4-10.57v34.11h-5.16V65.17h5.16v9.82c5.37-7.05,12.5-10.57,21.4-10.57,7.55,0,13.88,2.56,19,7.68,5.2,5.2,7.8,11.58,7.8,19.13s-2.56,13.89-7.68,19h0Zm-3.78-34.36c-4.28-4.28-9.4-6.42-15.35-6.42s-11.16,2.1-15.35,6.29-6.42,9.44-6.42,15.48,2.14,11.08,6.42,15.35c4.28,4.28,9.4,6.42,15.35,6.42s11.16-2.1,15.35-6.29,6.42-9.44,6.42-15.48-2.14-11.07-6.42-15.35Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  ),
  specify: (
    <svg
      aria-hidden
      className={logoClassName}
      viewBox="0 0 475.6 142.4"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M110.3 142.4h32v-33c-6.7 14.2-18.1 25.8-32 33z"
        fill="currentColor"
      />
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="B"
        x1="-.005"
        x2="95.345"
        y1=".055"
        y2="95.405"
      >
        <stop offset="0" stopColor="currentColor" stopOpacity="1" />
        <stop offset="1" stopColor="currentColor" stopOpacity="0.5" />
      </linearGradient>
      <path
        d="M6.7 78.9c0-39.3 31.9-71.2 71.2-71.2 28.4 0 53 16.7 64.4 40.8V.1H0v142.3h45.6C22.5 130.6 6.7 106.6 6.7 78.9z"
        fill="currentColor"
      />
      <path
        d="M66.9 115.6c-3.3 1.2-7.1 1.8-11.6 1.8-13.8 0-22.6-6.5-26.5-19.5l5.2-1.8c2.9 10.7 10.1 16.1 21.4 16.1 6.5 0 11.5-1.6 15.2-4.8 3.8-3.3 5.7-8.1 5.7-14.3 0-6-2.2-10.9-6.7-14.8-1.2-1.1-3-2.3-5.4-3.7-2.4-1.3-5.5-2.8-9.3-4.5-7.1-3.2-12-6-14.6-8.3-4.4-3.8-6.5-8.8-6.5-15s2.2-11.2 6.7-15c4.4-3.9 9.7-5.8 16.1-5.8 10.6 0 18 3.9 22.4 11.8L74 40c-1.7-2.8-3.7-4.8-6-6.2C65 32 61.2 31 56.5 31c-5 0-9.1 1.4-12.3 4.2-3.5 2.9-5.3 6.8-5.3 11.6 0 4.3 1.8 8 5.5 11.2 2.1 1.7 6.3 4 12.6 6.8 3.9 1.8 7.3 3.5 10.2 5.2s5.2 3.5 6.9 5.2c4.9 4.8 7.3 10.7 7.3 17.9 0 11.4-4.8 18.9-14.5 22.5h0zm67-5.3c-5.2 5.2-11.6 7.8-19.1 7.8-8.6 0-15.8-3.5-21.4-10.6v34.1h-5.2V65.2h5.2V75c5.4-7.1 12.5-10.6 21.4-10.6 7.6 0 13.9 2.6 19 7.7 5.2 5.2 7.8 11.6 7.8 19.1s-2.6 14-7.7 19.1h0zm-3.8-34.4c-4.3-4.3-9.4-6.4-15.3-6.4s-11.2 2.1-15.3 6.3c-4.3 4.3-6.4 9.4-6.4 15.5s2.1 11.1 6.4 15.3c4.3 4.3 9.4 6.4 15.3 6.4s11.2-2.1 15.3-6.3 6.4-9.4 6.4-15.5-2.1-11-6.4-15.3zm24.1 13.4c0 7.1 1.9 12.6 5.7 16.7 3.9 4.2 9.4 6.3 16.2 6.3 3.5 0 6.7-.6 9.6-1.8 3.6-1.5 6.8-4.6 9.7-9.2l4.7 2.1c-3.3 6.2-8.3 10.4-15.1 12.6-2.6.8-5.5 1.3-8.8 1.3-7.8 0-14.2-2.6-19.2-7.7-5.1-5.1-7.7-11.5-7.7-19.3s2.5-14.2 7.6-19.2c5.1-5.1 11.6-7.7 19.4-7.7s14.1 2.4 19.1 7.2c5.1 4.8 7.7 11 7.7 18.6l-48.9.1h0zm35.5-16.5c-3.9-2.8-8.5-4.3-13.6-4.3-10.7 0-17.8 5.3-21.1 15.9h42.2c-.9-4.8-3.4-8.6-7.5-11.6h0zm52.8 44.6c-7.7 0-14.1-2.6-19.3-7.7s-7.7-11.5-7.7-19.3 2.6-14.1 7.7-19.2 11.5-7.7 19.3-7.7c6.6 0 11.9 1.5 15.9 4.5v6.2l-3.3-2.1-3.5-1.9c-3.2-1.1-6.2-1.6-9.1-1.6-6.5 0-11.7 2-15.7 6-4.1 4.1-6.2 9.4-6.2 15.9s2.1 11.6 6.2 15.7 9.4 6.2 15.7 6.2c6 0 11.3-2 15.9-6v6.4c-4.7 3-10 4.6-15.9 4.6h0zm28.5-1v-52h5.2v52H271zm6.9-65.2c0 2.4-1.9 4.3-4.3 4.3s-4.3-1.9-4.3-4.3 1.9-4.3 4.3-4.3 4.3 1.9 4.3 4.3zM313 28.4l-3.4-.4c-4.7 0-7 2.8-7 8.3v28.1h12.3v5.2h-12.3v46.8h-5.2V69.6h-7v-5.2h7V34.8c0-8 4-12 12.1-12 1.8 0 3 .1 3.5.2 1 0 2.1.3 3.4.9v5.2l-3.4-.7h0zm23.8 112.4H331l13.5-29.2-21.9-47.2h5.5l19.4 41 19.1-41h5.7l-35.5 76.4h0zm77.6-23.2l-4.5-2.9 54.7-83H411v-5.2h63.2l-59.8 91.1h0z"
        fill="currentColor"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeWidth="1.5"
      />
    </svg>
  ),
};

type HSL = {
  hue: number;
  saturation: number;
  lightness: number;
};

export function hexToHsl(hex: string): HSL {
  const r = parseInt(hex.substring(1, 3), 16) / 255;
  const g = parseInt(hex.substring(3, 5), 16) / 255;
  const b = parseInt(hex.substring(5, 7), 16) / 255;

  const minComponent = Math.min(r, g, b);
  const maxComponent = Math.max(r, g, b);
  const delta = maxComponent - minComponent;

  let hue = 0;
  if (delta === 0) {
    hue = 0;
  } else if (maxComponent === r) {
    hue = ((g - b) / delta) % 6;
  } else if (maxComponent === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  hue = Math.round(hue * 60);

  const lightness = (maxComponent + minComponent) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  const sPercent = Math.round(saturation * 100);
  const lPercent = Math.round(lightness * 100);

  return { hue, saturation: sPercent, lightness: lPercent };
}

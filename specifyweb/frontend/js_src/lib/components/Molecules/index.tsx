/**
 * Generic React Components
 *
 * @module
 *
 */

import React from 'react';

import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';

export const loadingGif = (
  <div className="hover:animate-hue-rotate [.reduce-motion_&]:animate-hue-rotate">
    <div
      className={`
        spinner-border h-20 w-20 rounded-full border-8 border-brand-300
        [.motion-normal_&]:m-px
        [.motion-normal_&]:animate-spin
        [.motion-normal_&]:border-r-transparent
      `}
      role="status"
    >
      <span className="sr-only">{commonText.loading()}</span>
    </div>
  </div>
);

/*
 * This must be accompanied by a label since loading bar is hidden from screen
 * readers
 */
export const loadingBar = (
  <div className="pt-5 hover:animate-hue-rotate">
    <div
      aria-hidden
      className={`
        h-7 animate-bounce rounded bg-gradient-to-r from-orange-400 to-amber-200
      `}
    />
  </div>
);

/**
 * Add a JSX.Element in between JSX.Elements.
 *
 * Can't use .join() because it only works with strings.
 */
export const join = (
  // Don't need to add a [key] prop to these elements before passing in
  elements: RA<JSX.Element | string>,
  separator: JSX.Element
): RA<JSX.Element> =>
  elements.map((element, index, { length }) => (
    <React.Fragment key={index}>
      {element}
      {index + 1 === length ? undefined : separator}
    </React.Fragment>
  ));

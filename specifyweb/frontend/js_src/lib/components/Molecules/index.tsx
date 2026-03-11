/**
 * Generic React Components
 *
 * @module
 *
 */

import React from 'react';

import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { useHueDifference } from '../../hooks/useHueDifference';

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
const LoadingBar = () => {
  const hueDifference = useHueDifference();

  return (
    <div className="flex justify-center hover:animate-hue-rotate [.reduce-motion_&]:animate-hue-rotate">
      <img
        alt=""
        aria-hidden
        className="h-10 w-10 [.motion-normal_&]:animate-spin [.motion-normal_&]:[animation-duration:2s]"
        src="/static/img/short_logo.svg"
        style={{ filter: `hue-rotate(${hueDifference}deg)` }}
      />
    </div>
  );
};

export const loadingBar = <LoadingBar />;


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

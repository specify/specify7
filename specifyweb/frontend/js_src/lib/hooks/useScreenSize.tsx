import React from 'react';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config';

const resolvedConfig = resolveConfig(tailwindConfig);

const breakPoints = resolvedConfig.theme.screens;

/**
 * React Hook that can be used for conditional rendering based on screen size
 * Example usage:
 * ```ts
 *  const isSmallScreen = useScreenSize('sm');
 *  return isSmallScreen ? <SomeSmallComponent/> : <SomeLargeComponent>
 * ```
 * The screen size breakpoints will be equivalent to the tailwind breakpoints
 * for scteen size.
 * For more information, see the tailwind docs on responsive design and
 * breakkpoints:
 *  https://tailwindcss.com/docs/responsive-design
 */
export function useScreenSize(screenSize: keyof typeof breakPoints) {
  const breakPointSize = breakPoints[screenSize];

  const mediaQuery = `(min-width: ${breakPointSize})`;

  const windowMatchesBreakpoint = React.useCallback(() => {
    if (window === undefined) return false;
    return window.matchMedia(mediaQuery).matches;
  }, [mediaQuery]);

  const [isMatch, setIsMatch] = React.useState(windowMatchesBreakpoint);

  React.useEffect(() => {
    function handleWindowResize() {
      setIsMatch(() => windowMatchesBreakpoint());
    }
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  return isMatch;
}

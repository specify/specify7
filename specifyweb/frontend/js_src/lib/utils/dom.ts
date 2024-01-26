import { getTransitionDuration } from '../components/Preferences/Hooks';

export function smoothScroll(element: HTMLElement, top: number): void {
  if (typeof element.scrollTo === 'function')
    element.scrollTo({
      top,
      behavior: getTransitionDuration() === 0 ? 'auto' : 'smooth',
    });
  else element.scrollTop = element.scrollHeight;
}

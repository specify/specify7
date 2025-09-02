import { theories } from '../../../tests/utils';
import { f } from '../../../utils/functools';
import { exportsForTests } from '../Router';

const { parseClickEvent: parseEvent } = exportsForTests;

const parseClickEvent = (
  link: Element | string,
  extras?: Partial<MouseEvent>
): ReturnType<typeof parseEvent> =>
  parseEvent({
    target: typeof link === 'string' ? htmlToElement(link.trim()) : link,
    defaultPrevented: false,
    metaKey: false,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    preventDefault: f.void,
    ...extras,
  } as MouseEvent);

// Inspired by https://stackoverflow.com/a/35385518/8584605
function htmlToElement(html: string): ChildNode {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstChild!;
}

theories(parseClickEvent, {
  'external link': {
    in: [`<a href="https://example.com">link</a>`],
    out: undefined,
  },
  'hash url': { in: [`<a href="#abc">link</a>`], out: undefined },
  'ctrl click': {
    in: [`<a href="/specify/">link</a>`, { ctrlKey: true }],
    out: undefined,
  },
  'shift click': {
    in: [`<a href="/specify/">link</a>`, { shiftKey: true }],
    out: undefined,
  },
  'meta click': {
    in: [`<a href="/specify/">link</a>`, { metaKey: true }],
    out: undefined,
  },
  'alt click': {
    in: [`<a href="/specify/">link</a>`, { altKey: true }],
    out: { isOverlay: false, url: '/specify/' },
  },
  'alt click new tab': {
    in: [`<a href="/specify/" target="_blank">link</a>`, { altKey: true }],
    out: { isOverlay: false, url: '/specify/' },
  },
  'download link': {
    in: [`<a href="/specify/" download>link</a>`],
    out: undefined,
  },
  'target blank': {
    in: [`<a href="/specify/" target="_blank">link</a>`],
    out: undefined,
  },
  'target self': {
    in: [`<a href="/specify/" target="_self">link</a>`],
    out: { url: '/specify/', isOverlay: false },
  },
  'target empty': {
    in: [`<a href="/specify/" target="">link</a>`],
    out: { url: '/specify/', isOverlay: false },
  },
  'overlay link': {
    in: [`<a href="/specify/overlay/user-tools/">link</a>`],
    out: { url: '/specify/overlay/user-tools/', isOverlay: true },
  },
  'prevent default': {
    in: [`<a href="/specify/">link</a>`, { defaultPrevented: true }],
    out: undefined,
  },
  'link to another entrypoing': {
    in: [`<a href="/accounts/login" target="_blank">link</a>`],
    out: undefined,
  },
});

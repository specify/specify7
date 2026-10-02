import { Http } from '../../../utils/ajax/definitions';
import * as pingModule from '../../../utils/ajax/ping';
import { cachableUrls } from '../../InitialContext';
import { clearAllCache, clearUrlCache } from '../CacheBuster';

afterEach(() => {
  jest.restoreAllMocks();
});

test('clearUrlCache pings the url to bust its cache', async () => {
  const pingSpy = jest.spyOn(pingModule, 'ping').mockResolvedValue(Http.OK);

  await clearUrlCache('http://localhost/fake/cachable');

  expect(pingSpy).toHaveBeenCalledTimes(1);
  expect(pingSpy).toHaveBeenCalledWith(
    'http://localhost/fake/cachable',
    expect.objectContaining({ method: 'HEAD', cache: 'no-cache' })
  );
});

test('clearAllCache clears local storage and pings cachable urls', async () => {
  const pingSpy = jest.spyOn(pingModule, 'ping').mockResolvedValue(Http.OK);
  const url = 'http://localhost/fake/cachable';
  cachableUrls.add(url);

  localStorage.setItem('testKey', 'testValue');

  const result = await clearAllCache();

  cachableUrls.delete(url);

  expect(result).toBe(true);
  expect(localStorage.length).toBe(0);
  expect(pingSpy).toHaveBeenCalledWith(
    url,
    expect.objectContaining({ method: 'HEAD' })
  );
});

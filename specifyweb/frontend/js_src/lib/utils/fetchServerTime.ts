import { ajax } from './ajax';

export async function fetchServerTime(): Promise<{date: Date, rawTime: string}> {
  try {
    const response = await ajax<{ server_time: string }>('/context/server_time.json', {
      headers: { Accept: 'application/json' },
      errorMode: 'silent',
    });
    return {
      date: new Date(response.data.server_time),
      rawTime: response.data.server_time
    };
  } catch (error) {
    console.error('Failed to fetch server time:', error);
    // Fallback to local time if server time fetch fails
    const date = new Date();
    return {date, rawTime: date.toISOString()};
  }
}
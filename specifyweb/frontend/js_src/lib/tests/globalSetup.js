/** Make all tests use UTC, rather than local time zone */
export default () => {
  process.env.TZ = 'UTC';
};

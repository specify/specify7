/** Make all tests use UTC, rather than local time zone */
module.exports = () => {
  process.env.TZ = 'UTC';
}

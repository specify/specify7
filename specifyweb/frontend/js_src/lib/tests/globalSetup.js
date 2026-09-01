/** Make all tests use UTC, rather than local time zone */
export default () => {
  process.env.TZ = 'UTC';
};

// taken from  https://github.com/remix-run/react-router/blob/94d4351290267f1a7ed93f8639a588e7a901d24f/packages/react-router/__tests__/setup.ts#L4-L9
// via https://github.com/remix-run/react-router/issues/12363#issuecomment-2496226528
// to fix ReferenceError: TextEncoder is not defined
if (!globalThis.TextEncoder || !globalThis.TextDecoder) {
  const { TextDecoder, TextEncoder } = require("node:util");
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

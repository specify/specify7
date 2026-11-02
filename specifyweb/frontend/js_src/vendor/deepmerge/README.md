# Local deepmerge security fix

Jest's `jest-config` depends on `deepmerge@4.3.1`. No patched upstream release
is available for its returned-object prototype poisoning vulnerability. This
private fork is based on the CommonJS distribution of
[deepmerge 4.3.1](https://github.com/TehShrike/deepmerge/tree/v4.3.1), under the
MIT license in [license.txt](./license.txt).

The frontend's npm override resolves `deepmerge` to this directory. The only
behavioral change is filtering `__proto__` from enumerable keys before either
target or source properties are copied. The upstream target-copy path had no
such protection, and its source checks could be bypassed with a null-prototype
target. The filter also applies to nested objects and objects within arrays.
Other merge behavior and options are preserved.

This dependency is used for development/test configuration, not application
code. The local version is not an upstream patched release. Remove the override
and this directory when Jest no longer needs the affected package or an upstream
fix can replace it.

Run `npm run test:deepmerge` from the frontend directory to check the installed
override, security regressions, and merge compatibility. These tests also run as
part of `npm test`. Docker copies this directory before `npm ci` so the override
is available during installation.

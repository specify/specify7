import { theories } from '../../../tests/utils';
import { exportsForTests } from '../spec';

const { trimRegexString, normalizeRegexString } = exportsForTests;

theories(trimRegexString, [
  [[''], ''],
  [['[a-z]{3,}.*'], '[a-z]{3,}.*'],
  [['/^[a-z]{3,}.*$/'], '[a-z]{3,}.*'],
  [['^\\d{3}$'], '\\d{3}'],
  [['/^(KUI|KUBI|NHM)$/'], 'KUI|KUBI|NHM'],
]);

theories(normalizeRegexString, [
  [[''], '/^$/'],
  [['[a-z]{3,}.*'], '/^[a-z]{3,}.*$/'],
  [['/^[a-z]{3,}.*$/'], '/^[a-z]{3,}.*$/'],
  [['^\\d{3}$'], '/^\\d{3}$/'],
  [['\\d{3}'], '/^\\d{3}$/'],
  [['/\\d{3}/'], '/^\\d{3}$/'],
  [['KUI|KUBI|NHM'], '/^(KUI|KUBI|NHM)$/'],
  [['(KUI|KUBI)|NHM'], '/^((KUI|KUBI)|NHM)$/'],
]);

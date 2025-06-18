import { theories } from '../../../tests/utils';
import { dayjs } from '../../../utils/dayJs';
import { databaseDateFormat } from '../../../utils/parser/dateConfig';
import { exportsForTests } from '../DatePrecisionPicker';
import type { PartialDatePrecision } from '../useDatePrecision';

const { castMoment: cast } = exportsForTests;

const castMoment = (precision: PartialDatePrecision, date: Date): string =>
  cast(precision, dayjs(date)).format(databaseDateFormat);

theories(castMoment, [
  [['full', new Date('2020-02-02')], '2020-02-02T00:00:00'],
  [['month-year', new Date('2020-02-03')], '2020-02-01T00:00:00'],
  [['year', new Date('2020-02-04')], '2020-01-01T00:00:00'],
]);

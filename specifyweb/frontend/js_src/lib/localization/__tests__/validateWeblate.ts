import { program } from 'commander';

import { f } from '../../utils/functools';
import { scanUsages } from '../utils/scanUsages';
import { checkComponents } from '../utils/validateWeblate';
import { testLogging } from '../utils/testLogging';

program
  .name('Validate Weblate config')
  .description(
    'Makes sure Weblate components have valid settings. Creates missing components'
  );

const { error } = testLogging;

scanUsages('silent')
  .then((usages) => f.maybe(usages, checkComponents))
  .catch(error);

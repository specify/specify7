import { program } from 'commander';

import { scanUsages } from '../utils/scanUsages';
import { testLogging } from '../utils/testLogging';
import { checkComponents } from '../utils/validateWeblate';

program
  .name('Validate Weblate config')
  .description(
    'Makes sure Weblate components have valid settings. Creates missing components'
  );

const { error } = testLogging;

scanUsages('silent')
  .then(async (usages) =>
    usages === undefined ? undefined : checkComponents(usages, 'userInterface')
  )
  .catch(error);

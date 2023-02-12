/**
 * Parse XML cell with a command definition into a JSON structure
 *
 * Documentation - https://github.com/specify/specify7/wiki/Form-System#command
 * On any modifications, please check if documentation needs to be updated.
 */

import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { getParsedAttribute } from '../../utils/utils';
import { formatDisjunction } from '../Atoms/Internationalization';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Tables } from '../DataModel/types';
import { error } from '../Errors/assert';
import { addContext } from '../Errors/logContext';
import { legacyLocalize } from '../InitialContext/legacyUiLocalization';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';

export type UiCommands = {
  readonly GenerateLabel: State<'GenerateLabel'>;
  readonly ShowLoans: State<'ShowLoans'>;
  readonly ReturnLoan: State<'ReturnLoan'>;
  readonly Unsupported: State<
    'Unsupported',
    { readonly name: string | undefined }
  >;
  readonly Blank: State<'Blank'>;
  readonly WrongTable: State<
    'WrongTable',
    {
      readonly supportedTables: RA<keyof Tables>;
    }
  >;
};

const processUiCommand: {
  readonly [KEY in keyof UiCommands]: (payload: {
    readonly name: string | undefined;
    readonly model: SpecifyModel;
  }) => UiCommands[KEY | 'Blank' | 'WrongTable'];
} = {
  GenerateLabel: () =>
    hasPermission('/report', 'execute')
      ? { type: 'GenerateLabel' }
      : { type: 'Blank' },
  ShowLoans: ({ model }) =>
    model.name === 'Preparation'
      ? { type: 'ShowLoans' }
      : { type: 'WrongTable', supportedTables: ['Preparation'] },
  ReturnLoan: ({ model }) =>
    !hasTablePermission('LoanPreparation', 'update') ||
    !hasTablePermission('LoanReturnPreparation', 'update')
      ? { type: 'Blank' }
      : model.name === 'Loan'
      ? { type: 'ReturnLoan' }
      : { type: 'WrongTable', supportedTables: ['Loan'] },
  Unsupported: ({ name }) => {
    console.error(`Unsupported command: ${name ?? '(null)'}`);
    return { type: 'Unsupported', name };
  },
  Blank: () => ({ type: 'Blank' }),
  WrongTable: () => error('This parser should not get called'),
};

const commandTranslation: IR<keyof UiCommands> = {
  generateLabelBtn: 'GenerateLabel',
  ShowLoansBtn: 'ShowLoans',
  ReturnLoan: 'ReturnLoan',
};

export type CommandDefinition = {
  readonly label: LocalizedString | undefined;
  readonly commandDefinition: UiCommands[keyof UiCommands];
};

export function parseUiCommand(
  cell: Element,
  model: SpecifyModel
): CommandDefinition {
  const name = getParsedAttribute(cell, 'name');
  const label = getParsedAttribute(cell, 'label');
  const uiCommand =
    processUiCommand[commandTranslation[name ?? '']] ??
    processUiCommand[commandTranslation[label ?? '']] ??
    processUiCommand.Unsupported;

  addContext({ command: label ?? name });
  const definition = uiCommand({ name, model });
  if (definition.type === 'WrongTable')
    console.error(
      `Can't display ${label ?? name ?? 'plugin'} on ${
        model.name
      } form. Instead, try ` +
        `displaying it on the ${formatDisjunction(
          definition.supportedTables
        )} form`
    );

  return {
    commandDefinition: definition,
    label: f.maybe(label, legacyLocalize),
  };
}

/**
 * Parse XML cell with a command definition into a JSON structure
 *
 * Documentation - https://github.com/specify/specify7/wiki/Form-System#command
 * On any modifications, please check if documentation needs to be updated.
 */

import type { State } from 'typesafe-reducer';

import { getParsedAttribute } from '../../utils/utils';
import type {IR, ValueOf} from '../../utils/types';
import { legacyLocalize } from '../InitialContext/legacyUiLocalization';
import { f } from '../../utils/functools';

export type UiCommands = {
  readonly GenerateLabel: State<'GenerateLabel'>;
  readonly ShowLoans: State<'ShowLoans'>;
  readonly ReturnLoan: State<'ReturnLoan'>;
  readonly Unsupported: State<
    'Unsupported',
    { readonly name: string | undefined }
  >;
};

const processUiCommand: {
  readonly [KEY in keyof UiCommands]: (
    name: string | undefined
  ) => UiCommands[KEY];
} = {
  GenerateLabel: () => ({ type: 'GenerateLabel' }),
  ShowLoans: () => ({ type: 'ShowLoans' }),
  ReturnLoan: () => ({ type: 'ReturnLoan' }),
  Unsupported: (name) => ({ type: 'Unsupported', name }),
};

const commandTranslation: IR<keyof UiCommands> = {
  generateLabelBtn: 'GenerateLabel',
  ShowLoansBtn: 'ShowLoans',
  ReturnLoan: 'ReturnLoan',
};

export type CommandDefinition = {
  readonly label: string | undefined;
  readonly commandDefinition: ValueOf<UiCommands>;
};

export function parseUiCommand(cell: Element): CommandDefinition {
  const name = getParsedAttribute(cell, 'name');
  const label = getParsedAttribute(cell, 'label');
  const uiCommand =
    processUiCommand[commandTranslation[name ?? '']] ??
    processUiCommand[commandTranslation[label ?? '']] ??
    processUiCommand.Unsupported;
  return {
    commandDefinition: uiCommand(name),
    label: f.maybe(label, legacyLocalize),
  };
}

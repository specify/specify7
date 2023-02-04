import { parseUiCommand } from '../commands';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { requireContext } from '../../../tests/helpers';
import { schema } from '../../DataModel/schema';

requireContext();

describe('parseUiCommand', () => {
  test('Simplest case', () => {
    const consoleError = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(consoleError);
    expect(
      parseUiCommand(strictParseXml('<cell />'), schema.models.CollectionObject)
    ).toEqual({
      commandDefinition: {
        type: 'Unsupported',
        name: undefined,
      },
      label: undefined,
    });
  });

  test('Unsupported command', () => {
    const consoleError = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(consoleError);
    expect(
      parseUiCommand(
        strictParseXml('<cell name="test" label="test2" />'),
        schema.models.CollectionObject
      )
    ).toEqual({
      commandDefinition: {
        type: 'Unsupported',
        name: 'test',
      },
      label: 'test2',
    });
  });

  test('Generate Label', () =>
    expect(
      parseUiCommand(
        strictParseXml('<cell name="generateLabelBtn" label="FINDNEXT" />'),
        schema.models.CollectionObject
      )
    ).toEqual({
      commandDefinition: {
        type: 'GenerateLabel',
      },
      label: 'Find Next',
    }));

  test('Show Loans Command', () =>
    expect(
      parseUiCommand(
        strictParseXml('<cell name="someName" label="ShowLoansBtn" />'),
        schema.models.Preparation
      )
    ).toEqual({
      commandDefinition: {
        type: 'ShowLoans',
      },
      label: 'ShowLoansBtn',
    }));

  test('Return Loan Command', () =>
    expect(
      parseUiCommand(
        strictParseXml('<cell name="ReturnLoan" label="generateLabelBtn" />'),
        schema.models.Loan
      )
    ).toEqual({
      commandDefinition: {
        type: 'ReturnLoan',
      },
      label: 'generateLabelBtn',
    }));
});

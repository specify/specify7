import { requireContext } from '../../../tests/helpers';
import { strictParseXml } from '../../AppResources/parseXml';
import { tables } from '../../DataModel/tables';
import type { SimpleXmlNode } from '../../Syncer/xmlToJson';
import { toSimpleXmlNode, xmlToJson } from '../../Syncer/xmlToJson';
import { parseUiCommand } from '../commands';

requireContext();

const xml = (xml: string): SimpleXmlNode =>
  toSimpleXmlNode(xmlToJson(strictParseXml(xml)));

describe('parseUiCommand', () => {
  test('Simplest case', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(parseUiCommand(xml('<cell />'), tables.CollectionObject)).toEqual({
      commandDefinition: {
        type: 'Unsupported',
        name: undefined,
      },
      label: undefined,
    });
  });

  test('Unsupported command', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(
      parseUiCommand(
        xml('<cell name="test" label="test2" />'),
        tables.CollectionObject
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
        xml('<cell name="generateLabelBtn" label="FINDNEXT" />'),
        tables.CollectionObject
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
        xml('<cell name="someName" label="ShowLoansBtn" />'),
        tables.Preparation
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
        xml('<cell name="ReturnLoan" label="generateLabelBtn" />'),
        tables.Loan
      )
    ).toEqual({
      commandDefinition: {
        type: 'ReturnLoan',
      },
      label: 'generateLabelBtn',
    }));
});

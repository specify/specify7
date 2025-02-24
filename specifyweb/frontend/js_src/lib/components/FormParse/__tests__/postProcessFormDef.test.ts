import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { ensure, localized } from '../../../utils/types';
import { getField } from '../../DataModel/helpers';
import { tables } from '../../DataModel/tables';
import type { CellTypes, FormCellDefinition } from '../cells';
import { exportsForTests, postProcessFormDef } from '../postProcessFormDef';

requireContext();

const {
  createLabelsPostProcessor,
  indexFields,
  indexLabels,
  fixColumns,
  bindLooseLabels,
  postProcessLabel,
  addLabelTitle,
  replaceBlankLabels,
  addBlankCell,
  removeRedundantLabel,
  addMissingLabel,
} = exportsForTests;

const labelCell = ensure<CellTypes['Label'] & FormCellDefinition>()({
  id: 'test',
  colSpan: 3,
  align: 'right',
  verticalAlign: 'stretch',
  visible: false,
  labelForCellId: 'a',
  ariaLabel: undefined,
  type: 'Label',
  text: localized('Text'),
  title: localized('a'),
  fieldNames: ['catalogNumber'],
});
const looseLabel = { ...labelCell, labelForCellId: undefined } as const;
const divisionLabel = {
  ...labelCell,
  fieldNames: undefined,
  text: undefined,
  title: undefined,
  id: 'divLabel',
} as const;
const blankLabel = { ...labelCell, text: localized('') } as const;
const blankCell = {
  type: 'Blank',
  id: blankLabel.id,
  align: 'left',
  verticalAlign: 'stretch',
  colSpan: blankLabel.colSpan,
  visible: false,
  ariaLabel: undefined,
} as const;

const missingLabelCheckbox = ensure<FormCellDefinition>()({
  id: 'test2',
  colSpan: 3,
  align: 'right',
  verticalAlign: 'stretch',
  visible: false,
  ariaLabel: undefined,
  type: 'Field',
  fieldNames: ['catalogNumber'],
  isRequired: true,
  fieldDefinition: {
    defaultValue: undefined,
    isReadOnly: false,
    type: 'Checkbox',
    printOnSave: false,
    label: undefined,
  },
} as const);

const checkboxWithLabel = ensure<FormCellDefinition>()({
  ...missingLabelCheckbox,
  fieldDefinition: {
    ...missingLabelCheckbox.fieldDefinition,
    label: localized('Catalog Number'),
  },
} as const);

const missingLabelTextField = ensure<FormCellDefinition>()({
  id: 'test3',
  colSpan: 3,
  align: 'right',
  verticalAlign: 'stretch',
  visible: false,
  ariaLabel: undefined,
  type: 'Field',
  fieldNames: ['catalogNumber'],
  isRequired: true,
  fieldDefinition: {
    defaultValue: undefined,
    isReadOnly: false,
    min: undefined,
    max: undefined,
    step: undefined,
    type: 'Text',
    minLength: undefined,
    maxLength: undefined,
    whiteSpaceSensitive: undefined,
  },
} as const);

test('postProcessFormDef', () =>
  expect(
    postProcessFormDef(
      [undefined],
      [[blankLabel], [], [missingLabelCheckbox]],
      tables.CollectionObject
    )
  ).toEqual({
    columns: [undefined, undefined, undefined],
    rows: [
      [blankCell],
      [{ ...blankCell, id: undefined }],
      [
        {
          ...missingLabelCheckbox,
          fieldDefinition: {
            ...missingLabelCheckbox.fieldDefinition,
            label: getField(tables.CollectionObject, 'catalogNumber').label,
          },
        },
      ],
    ],
  }));

test('createLabelsPostProcessor', () => {
  const processor = createLabelsPostProcessor(
    [
      [looseLabel, missingLabelTextField],
      [blankLabel, checkboxWithLabel, divisionLabel],
    ],
    tables.Accession
  );
  // Non-label cells are unchanged
  expect(processor(missingLabelTextField, 0, 0)).toEqual(missingLabelTextField);
  expect(processor(looseLabel, 0, 0)).toEqual({
    ...looseLabel,
    labelForCellId: missingLabelTextField.id,
    align: 'right',
  });
  expect(processor(divisionLabel, 1, 2)).toEqual({
    ...divisionLabel,
    align: 'right',
    text: getField(tables.Accession, 'division').label,
  });
  expect(processor(blankLabel, 1, 0)).toEqual(blankCell);
});

test('indexFields', () => {
  const divisionComboBox = ensure<FormCellDefinition>()({
    ...missingLabelTextField,
    id: 'text4',
    fieldNames: ['division'],
  });
  expect(
    indexFields(
      [
        [labelCell, divisionComboBox],
        [missingLabelTextField, checkboxWithLabel],
      ],
      tables.Accession
    )
  ).toEqual({
    [missingLabelTextField.id]: {
      fieldNames: missingLabelTextField.fieldNames,
      labelOverride: undefined,
      altLabel: undefined,
    },
    [checkboxWithLabel.id]: {
      fieldNames: checkboxWithLabel.fieldNames,
      labelOverride: checkboxWithLabel.fieldDefinition.label,
      altLabel: undefined,
    },
    [divisionComboBox.id]: {
      fieldNames: divisionComboBox.fieldNames,
      labelOverride: undefined,
      altLabel: getField(tables.Accession, 'division').label,
    },
  });
});

theories(indexLabels, [
  {
    in: [[[missingLabelCheckbox], [labelCell]]],
    out: {
      [labelCell.labelForCellId]: labelCell,
    },
  },
]);

theories(fixColumns, {
  'create additional columns if overflowing': {
    in: [
      [undefined, undefined, undefined],
      [[missingLabelCheckbox, missingLabelTextField]],
    ],
    out: [undefined, undefined, undefined, undefined, undefined, undefined],
  },
  "don't create additional columns if not overflowing": {
    in: [[undefined, undefined, undefined], [[missingLabelCheckbox]]],
    out: [undefined, undefined, undefined],
  },
});

theories(bindLooseLabels, {
  "don't change labels with labelForCellId": {
    in: [labelCell, {}, undefined, undefined],
    out: labelCell,
  },
  'associate label with a loose field that follows it': {
    in: [looseLabel, {}, missingLabelTextField, undefined],
    out: { ...looseLabel, labelForCellId: missingLabelTextField.id },
  },
  "don't associate label if following field already has label": {
    in: [
      looseLabel,
      { [missingLabelTextField.id]: labelCell },
      missingLabelTextField,
      undefined,
    ],
    out: looseLabel,
  },
  'associate label with a field in next row': {
    in: [looseLabel, {}, undefined, missingLabelTextField],
    out: { ...looseLabel, labelForCellId: missingLabelTextField.id },
  },
  "don't associate label with a next row field that already has label": {
    in: [
      looseLabel,
      { [missingLabelTextField.id]: labelCell },
      undefined,
      missingLabelTextField,
    ],
    out: looseLabel,
  },
  'disable auto bind for plugins': {
    in: [
      looseLabel,
      {},
      {
        ...missingLabelCheckbox,
        fieldDefinition: {
          isReadOnly: true,
          type: 'Plugin',
          pluginDefinition: {
            type: 'Unsupported',
            name: undefined,
          },
        },
      },
      undefined,
    ],
    out: looseLabel,
  },
  'disable auto bind for checkboxes': {
    in: [looseLabel, {}, missingLabelCheckbox, undefined],
    out: looseLabel,
  },
});

theories(postProcessLabel, {
  "don't right align single column label": {
    in: [labelCell, true, {}],
    out: { ...labelCell, align: 'left' },
  },
  'some fields can overwrite their labels': {
    in: [
      labelCell,
      true,
      {
        a: {
          labelOverride: localized('b'),
          fieldNames: ['field'],
          altLabel: undefined,
        },
      },
    ],
    out: {
      ...labelCell,
      fieldNames: ['field'],
      text: localized('b'),
      align: 'left',
    },
  },
  'field alt text is used as a fallback': {
    in: [
      { ...labelCell, text: undefined },
      true,
      {
        a: {
          labelOverride: undefined,
          fieldNames: undefined,
          altLabel: localized('b'),
        },
      },
    ],
    out: { ...labelCell, text: localized('b'), align: 'left' },
  },
});

describe(addLabelTitle, () => {
  test('adds title and text if missing', () =>
    expect(
      addLabelTitle(
        {
          ...labelCell,
          text: undefined,
          title: undefined,
        },
        tables.CollectionObject
      )
    ).toEqual({
      ...labelCell,
      text: getField(tables.CollectionObject, 'catalogNumber').label,
      title: getField(
        tables.CollectionObject,
        'catalogNumber'
      ).getLocalizedDesc(),
    }));

  test("doesn't replace existing text", () =>
    expect(addLabelTitle(labelCell, tables.CollectionObject)).toEqual(
      labelCell
    ));

  test('adds label for division combo box', () =>
    expect(addLabelTitle(divisionLabel, tables.Accession)).toEqual({
      ...divisionLabel,
      text: getField(tables.Accession, 'division').label,
    }));

  test('if all else fails, uses fieldName', () =>
    expect(
      addLabelTitle(
        {
          ...labelCell,
          text: undefined,
          fieldNames: ['a'],
        },
        tables.Accession
      )
    ).toEqual({ ...labelCell, text: 'a', fieldNames: ['a'] }));
});

theories(replaceBlankLabels, {
  'non empty label is unchanged': {
    in: [labelCell],
    out: labelCell,
  },
  'empty label is replaced': {
    in: [blankLabel],
    out: blankCell,
  },
});

const extraBlankColumns = 2;
theories(addBlankCell, [
  {
    in: [
      [missingLabelCheckbox, checkboxWithLabel],
      missingLabelCheckbox.colSpan +
        checkboxWithLabel.colSpan +
        extraBlankColumns,
    ],
    out: [
      missingLabelCheckbox,
      checkboxWithLabel,
      {
        type: 'Blank',
        id: undefined,
        align: 'left',
        verticalAlign: 'stretch',
        colSpan: extraBlankColumns,
        visible: false,
        ariaLabel: undefined,
      },
    ],
  },
]);

theories(removeRedundantLabel, [
  { in: [checkboxWithLabel], out: missingLabelCheckbox },
]);

describe('addMissingLabel', () => {
  test('checkbox with label is unchanged', () => {
    const withLabel = {
      ...missingLabelCheckbox,
      fieldDefinition: {
        ...missingLabelCheckbox.fieldDefinition,
        label: localized('test'),
      },
    };

    expect(addMissingLabel(withLabel, tables.CollectionObject)).toEqual(
      withLabel
    );
  });

  test('checkbox can get label from field label', () =>
    expect(
      addMissingLabel(missingLabelCheckbox, tables.CollectionObject)
    ).toEqual({
      ...missingLabelCheckbox,
      fieldDefinition: {
        ...missingLabelCheckbox.fieldDefinition,
        label: getField(tables.CollectionObject, 'catalogNumber').label,
      },
    }));

  test('cell with ariaLabel is unchanged', () => {
    const withLabel = {
      ...missingLabelTextField,
      ariaLabel: localized('test'),
    };
    expect(addMissingLabel(withLabel, tables.CollectionObject)).toEqual(
      withLabel
    );
  });

  test('field cell can get label from field label', () =>
    expect(
      addMissingLabel(missingLabelTextField, tables.CollectionObject)
    ).toEqual({
      ...missingLabelTextField,
      ariaLabel: getField(tables.CollectionObject, 'catalogNumber').label,
    }));
});

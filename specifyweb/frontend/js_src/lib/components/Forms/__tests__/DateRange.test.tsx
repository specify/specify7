import { exportsForTests } from '../DateRange';
import { requireContext } from '../../../tests/helpers';

const { rangeDateFields } = exportsForTests;

requireContext();

test('Range date fields are calculated correctly', () =>
  expect(rangeDateFields()).toMatchInlineSnapshot(`
    {
      "Address": [
        "endDate",
        "startDate",
      ],
      "Appraisal": [
        "appraisalDate",
      ],
      "Borrow": [
        "borrowDate",
      ],
      "CollectingEvent": [
        "startDate",
        "endDate",
      ],
      "CollectingTrip": [
        "endDate",
        "startDate",
      ],
      "CollectionObject": [
        "catalogedDate",
      ],
      "Deaccession": [
        "deaccessionDate",
      ],
      "Determination": [
        "determinedDate",
      ],
      "Disposal": [
        "disposalDate",
      ],
      "ExchangeIn": [
        "exchangeDate",
      ],
      "ExchangeOut": [
        "exchangeDate",
      ],
      "FieldNotebook": [
        "endDate",
        "startDate",
      ],
      "FieldNotebookPageSet": [
        "endDate",
        "startDate",
      ],
      "Gift": [
        "giftDate",
      ],
      "Loan": [
        "loanDate",
      ],
      "Permit": [
        "endDate",
        "startDate",
      ],
      "Preparation": [
        "preparedDate",
      ],
      "Project": [
        "endDate",
        "startDate",
      ],
      "RepositoryAgreement": [
        "endDate",
        "startDate",
      ],
      "Shipment": [
        "shipmentDate",
      ],
    }
  `));

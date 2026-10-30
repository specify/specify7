import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { commonText } from '../../../localization/common';
import { overrideAjax } from '../../../tests/ajax';
import { mockTime, requireContext } from '../../../tests/helpers';
import { overwriteReadOnly } from '../../../utils/types';
import { Contexts } from '../../Core/Contexts';
import { getResourceApiUrl } from '../../DataModel/resource';
import { tables } from '../../DataModel/tables';
import { ShowLoansCommand } from '../../FormCommands/ShowTransactions';
import { userInformation } from '../../InitialContext/userInformation';
import { SubViewContext } from '../../Forms/SubView';

mockTime();
requireContext();

const agentUrl = getResourceApiUrl('Agent', 1);
const agentResponse = {
  id: 1,
  resource_uri: agentUrl,
  agenttype: 1,
  lastname: 'Current',
  firstname: 'Agent',
};
const onAgentFetch = jest.fn(() => agentResponse);
overrideAjax(agentUrl, onAgentFetch);
const emptyInteractionCollection = {
  objects: [],
  meta: { limit: 0, offset: 0, total_count: 0 },
};
for (const [tableName, relationship] of [
  ['disposal', 'disposalpreparations'],
  ['exchangein', 'exchangeinpreps'],
  ['exchangeout', 'exchangeoutpreps'],
  ['gift', 'giftpreparations'],
])
  overrideAjax(
    `/api/specify/${tableName}/?${relationship}__preparation__exact=2&limit=0`,
    emptyInteractionCollection
  );
overrideAjax(
  '/api/specify/loan/?loanpreparations__preparation__exact=2&limit=0',
  {
    objects: [{ id: 1, resource_uri: getResourceApiUrl('Loan', 1) }],
    meta: { limit: 0, offset: 0, total_count: 1 },
  }
);
const preparationUrl = getResourceApiUrl('Preparation', 2);
const collectionObjectUrl = getResourceApiUrl('CollectionObject', 65);
overrideAjax(preparationUrl, {
  id: 2,
  resource_uri: preparationUrl,
  collectionobject: collectionObjectUrl,
  preptype: getResourceApiUrl('PrepType', 1),
});
overrideAjax(getResourceApiUrl('PrepType', 1), {
  id: 1,
  resource_uri: getResourceApiUrl('PrepType', 1),
  name: 'Specimen',
});
const loanView = (
  tableName: string,
  viewName: string,
  viewDefinition: string
) => ({
  name: viewName,
  class: `edu.ku.brc.specify.datamodel.${tableName}`,
  view: viewName,
  resourcelabels: 'false',
  altviews: {
    [`${viewName} Edit`]: {
      name: `${viewName} Edit`,
      viewdef: viewName,
      mode: 'edit',
    },
  },
  viewdefs: { [viewName]: viewDefinition },
  viewsetLevel: '',
  viewsetName: '',
  viewsetSource: '',
  viewsetId: null,
  viewsetFile: null,
});
overrideAjax(
  '/context/view.json?name=Loan',
  loanView(
    'Loan',
    'Loan',
    '<viewdef type="form" name="Loan" class="edu.ku.brc.specify.datamodel.Loan"><rows><row><cell type="command" name="ReturnLoan" label="Return Loan" commandtype="Interactions" action="ReturnLoan" /></row><row><cell type="subview" name="loanPreparations" viewname="LoanItems" /></row></rows></viewdef>'
  )
);
overrideAjax(
  '/context/view.json?name=LoanItems',
  loanView(
    'LoanPreparation',
    'LoanItems',
    '<viewdef type="form" name="LoanItems" class="edu.ku.brc.specify.datamodel.LoanPreparation"><rows><row><cell type="field" name="preparation.collectionObject.catalogNumber" uitype="text" /><cell type="field" name="preparation.prepType.name" uitype="text" /><cell type="field" name="preparation.countAmt" uitype="text" /><cell type="field" name="preparation.collectionObject.currentDetermination.preferredTaxon.fullName" uitype="text" /></row><row><cell type="field" name="quantity" uitype="spinner" /><cell type="field" name="quantityReturned" uitype="text" /><cell type="field" name="quantityResolved" uitype="text" /><cell type="subview" name="loanReturnPreparations" viewname="LoanReturnPreparation" initialize="btn=true;icon=LoanReturnPreparation" /></row><row><cell type="field" name="descriptionOfMaterial" uitype="text" /><cell type="field" name="isResolved" uitype="checkbox" /></row></rows></viewdef>'
  )
);
overrideAjax(
  '/context/view.json?name=LoanReturnPreparation',
  loanView(
    'LoanReturnPreparation',
    'LoanReturnPreparation',
    '<viewdef type="form" name="LoanReturnPreparation" class="edu.ku.brc.specify.datamodel.LoanReturnPreparation"><rows><row><cell type="field" name="receivedBy" uitype="querycbx" /></row></rows></viewdef>'
  )
);
overrideAjax(getResourceApiUrl('Loan', 1), {
  id: 1,
  resource_uri: getResourceApiUrl('Loan', 1),
  loanpreparations: [
    {
      id: 2,
      resource_uri: getResourceApiUrl('LoanPreparation', 2),
      preparation: preparationUrl,
      quantity: 5,
      quantityresolved: 0,
      quantityreturned: 0,
      loanreturnpreparations: [],
    },
  ],
});
overrideAjax('/delete_blockers/delete_blockers/loan/1/', []);
const onCollectionObjectFetch = jest.fn(() => ({
  id: 65,
  resource_uri: collectionObjectUrl,
  catalognumber: '65',
  collectionmemberid: 1,
  collection: getResourceApiUrl('Collection', 4),
  collectionObjectType: getResourceApiUrl('CollectionObjectType', 1),
  determinations: [],
  preparations: [
    {
      id: 2,
      resource_uri: preparationUrl,
      collectionmemberid: 1,
      countamt: 2,
      collectionobject: collectionObjectUrl,
      preptype: getResourceApiUrl('PrepType', 1),
      loanpreparations: '/api/specify/loanpreparation/?preparation=2',
    },
  ],
}));
overrideAjax(collectionObjectUrl, onCollectionObjectFetch);

test('opens Return Loan through the Show Loans command', async () => {
  const originalCurrentAgent = userInformation.currentCollectionAgent;
  overwriteReadOnly(userInformation, 'currentCollectionAgent', agentResponse);
  const collectionObject = new tables.CollectionObject.Resource({
    id: 65,
    resource_uri: collectionObjectUrl,
    preparations: [
      {
        id: 2,
        resource_uri: preparationUrl,
        collectionObject: collectionObjectUrl,
        prepType: getResourceApiUrl('PrepType', 1),
        countAmt: 2,
        isOnLoan: true,
      },
    ],
  });
  const preparation = new tables.Preparation.Resource({
    id: 2,
    resource_uri: preparationUrl,
    collectionObject: collectionObjectUrl,
    prepType: getResourceApiUrl('PrepType', 1),
    countAmt: 2,
    isOnLoan: true,
  });
  const preparationsRelationship =
    tables.CollectionObject.strictGetRelationship('preparations');
  try {
    render(
      <MemoryRouter>
        <Contexts>
          <SubViewContext.Provider
            value={{
              relationship: preparationsRelationship,
              formType: 'form',
              sortField: undefined,
              parentContext: [
                {
                  relationship: preparationsRelationship,
                  parentResource: collectionObject,
                },
              ],
              handleChangeFormType: jest.fn(),
              handleChangeSortField: jest.fn(),
            }}
          >
            <ShowLoansCommand preparation={preparation} onClose={jest.fn()} />
          </SubViewContext.Provider>
        </Contexts>
      </MemoryRouter>
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: /Loan records \(1\)/,
      })
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Return Loan' }));

    expect(
      await screen.findByRole('button', { name: commonText.apply() })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('dialog')).toHaveLength(3);
    expect(
      await screen.findByRole('cell', { name: 'Specimen' })
    ).toBeInTheDocument();
    expect(onCollectionObjectFetch).toHaveBeenCalled();
    expect(onAgentFetch).toHaveBeenCalled();
  } finally {
    overwriteReadOnly(
      userInformation,
      'currentCollectionAgent',
      originalCurrentAgent
    );
  }
});

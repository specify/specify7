import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { interactionsText } from '../../localization/interactions';
import type { Preparations } from '../../utils/ajax/specifyApi';
import { getInteractionsForPrepId } from '../../utils/ajax/specifyApi';
import { syncFieldFormat } from '../../utils/fieldFormat';
import type { RA, RR } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import { formatNumber } from '../Atoms/Internationalization';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import { getField } from '../DataModel/helpers';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceViewUrl } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import type { ExchangeOut, Gift, Loan } from '../DataModel/types';
import { ResourceView } from '../Forms/ResourceView';

export function PrepDialogRow({
  preparation,
  selected,
  onChange: handleChange,
}: {
  readonly preparation: Preparations[number];
  readonly selected: number;
  readonly onChange: (newSelected: number) => void;
}): JSX.Element {
  const unavailableCount = preparation.countAmount - preparation.available;

  const available = Math.max(0, preparation.available);
  const checked = selected !== 0;
  const loading = React.useContext(LoadingContext);
  const [state, setState] = React.useState<
    | State<
        'ItemSelection',
        {
          readonly items: RR<
            'ExchangeOut' | 'Gift' | 'Loan',
            RA<{
              readonly id: number;
              readonly label: LocalizedString;
            }>
          >;
        }
      >
    | State<
        'ResourceDialog',
        {
          readonly resource: SpecifyResource<ExchangeOut | Gift | Loan>;
        }
      >
    | State<'Main'>
  >({ type: 'Main' });

  return (
    <>
      <tr>
        <td>
          <Input.Checkbox
            aria-label={interactionsText.selectAll()}
            checked={checked}
            title={interactionsText.selectAll()}
            onValueChange={(): void => handleChange(checked ? 0 : available)}
          />
        </td>
        {typeof preparation.collectionObjectId === 'number' ? (
          <td className="justify-end tabular-nums">
            <Link.NewTab
              href={getResourceViewUrl(
                'CollectionObject',
                preparation.collectionObjectId
              )}
            >
              {
                syncFieldFormat(
                  getField(schema.models.CollectionObject, 'catalogNumber'),
                  undefined,
                  preparation.catalogNumber
                ) as LocalizedString
              }
            </Link.NewTab>
          </td>
        ) : (
          <td className="justify-end tabular-nums">
            {
              syncFieldFormat(
                getField(schema.models.CollectionObject, 'catalogNumber'),
                undefined,
                preparation.catalogNumber
              ) as LocalizedString
            }
          </td>
        )}

        {typeof preparation.taxonId === 'number' ? (
          <td>
            <Link.NewTab
              href={getResourceViewUrl('Taxon', preparation.taxonId)}
            >
              {preparation.taxon as LocalizedString}
            </Link.NewTab>
          </td>
        ) : (
          <td>{preparation.taxon}</td>
        )}
        <td>{preparation.prepType}</td>
        <td>
          <Input.Number
            aria-label={interactionsText.selectedAmount()}
            max={preparation.available}
            min={0}
            title={interactionsText.selectedAmount()}
            value={selected}
            onValueChange={handleChange}
          />
        </td>
        <td className="justify-end tabular-nums">{preparation.available}</td>
        <td className="justify-end tabular-nums">
          {
            /* If unavailable items, link to related interactions */
            unavailableCount === 0 ? (
              0
            ) : (
              <Button.LikeLink
                onClick={(): void =>
                  state.type === 'Main'
                    ? loading(
                        getInteractionsForPrepId(
                          preparation.preparationId
                        ).then(([_id, ...rawItems]) => {
                          const [loans, gifts, exchangeOuts] = rawItems.map(
                            (preparations) =>
                              preparations
                                ?.split(',')
                                .map((object) => object.split('>|<'))
                                .map(([id, label]) => ({
                                  id: Number.parseInt(id),
                                  label: label as LocalizedString,
                                })) ?? []
                          );
                          const count =
                            loans.length + gifts.length + exchangeOuts.length;

                          setState(
                            count === 1
                              ? {
                                  type: 'ResourceDialog',
                                  resource: new (loans.length === 1
                                    ? schema.models.Loan
                                    : gifts.length === 1
                                    ? schema.models.Gift
                                    : schema.models.ExchangeOut
                                  ).Resource({
                                    id: [...loans, ...gifts, ...exchangeOuts][0]
                                      .id,
                                  }),
                                }
                              : {
                                  type: 'ItemSelection',
                                  items: {
                                    Loan: loans,
                                    Gift: gifts,
                                    ExchangeOut: exchangeOuts,
                                  },
                                }
                          );
                        })
                      )
                    : setState({ type: 'Main' })
                }
              >
                {formatNumber(unavailableCount)}
              </Button.LikeLink>
            )
          }
        </td>
      </tr>
      {state.type === 'ItemSelection' && (
        <tr>
          <td className="col-span-full">
            {Object.entries(state.items).map(([tableName, items]) =>
              items.map(({ id, label }) => (
                <Button.LikeLink
                  onClick={(): void =>
                    setState({
                      type: 'ResourceDialog',
                      resource: new schema.models[tableName].Resource({ id }),
                    })
                  }
                >
                  {interactionsText.prepReturnFormatter({
                    tableName: schema.models[tableName].label,
                    resource: label,
                  })}
                </Button.LikeLink>
              ))
            )}
          </td>
        </tr>
      )}
      {state.type === 'ResourceDialog' && (
        <ResourceView
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          mode="edit"
          resource={state.resource}
          onAdd={undefined}
          onClose={(): void => setState({ type: 'Main' })}
          onDeleted={undefined}
          onSaved={undefined}
        />
      )}
    </>
  );
}

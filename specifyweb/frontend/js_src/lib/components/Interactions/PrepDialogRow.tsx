import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { interactionsText } from '../../localization/interactions';
import type { RA, RR } from '../../utils/types';
import { localized } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import { formatNumber } from '../Atoms/Internationalization';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import { getField } from '../DataModel/helpers';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceViewUrl } from '../DataModel/resource';
import { genericTables, tables } from '../DataModel/tables';
import type { ExchangeOut, Gift, Loan } from '../DataModel/types';
import { syncFieldFormat } from '../Formatters/fieldFormat';
import { ResourceView } from '../Forms/ResourceView';
import type { PreparationData } from './helpers';
import { getInteractionsForPrepId } from './helpers';

export function PrepDialogRow({
  preparation,
  selected,
  onChange: handleChange,
}: {
  readonly preparation: PreparationData;
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
        <td className="justify-end tabular-nums">
          <Link.NewTab
            href={getResourceViewUrl(
              'CollectionObject',
              preparation.collectionObjectId
            )}
          >
            {syncFieldFormat(
              getField(tables.CollectionObject, 'catalogNumber'),
              preparation.catalogNumber
            )}
          </Link.NewTab>
        </td>
        <td>
          {preparation.taxon !== undefined &&
          preparation.taxonId !== undefined ? (
            <Link.NewTab
              href={getResourceViewUrl('Taxon', preparation.taxonId)}
            >
              {localized(preparation.taxon)}
            </Link.NewTab>
          ) : undefined}
        </td>
        <td>
          {preparation.cogName !== undefined &&
          preparation.cogId !== undefined ? (
            <Link.NewTab
              href={getResourceViewUrl(
                'CollectionObjectGroup',
                preparation.cogId
              )}
            >
              {localized(preparation.cogName)}
            </Link.NewTab>
          ) : undefined}
        </td>
        <td>{preparation.prepType}</td>
        <td>
          <Input.Integer
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
                                  label: localized(label),
                                })) ?? []
                          );
                          const count =
                            loans.length + gifts.length + exchangeOuts.length;
                          setState(
                            count === 1
                              ? {
                                  type: 'ResourceDialog',
                                  resource: new (loans.length === 1
                                    ? tables.Loan
                                    : gifts.length === 1
                                      ? tables.Gift
                                      : tables.ExchangeOut
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
                  key={id}
                  onClick={(): void =>
                    setState({
                      type: 'ResourceDialog',
                      resource: new genericTables[tableName].Resource({ id }),
                    })
                  }
                >
                  {interactionsText.prepReturnFormatter({
                    tableName: genericTables[tableName].label,
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

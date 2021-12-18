import * as React from 'react';

import type { SpecifyResource } from '../legacytypes';
import treeText from '../localization/tree';
import { getPref } from '../remoteprefs';
import { getModel } from '../schema';
import type { RA } from '../types';
import { defined } from '../types';
import { Autocomplete } from './autocomplete';
import { Button, className } from './basic';
import createBackboneView from './reactbackboneextend';
import commonText from '../localization/common';

`
<style>
#list {
  display: inline-grid;
  grid-template-columns: auto auto auto;
}

#list ul,
#list li {
  display: contents;
}

#list button {
  border: none;
  background: none;
  text-align: left;
}

.border-left {
  border-left: 1px solid #fcf;
}

.border-bottom {
  border-bottom: 1px solid #fcf;
}
</style>
<section id="list"><ul role="tree"><button id="earth">Earth</button><button id="continent">Continent</button><button id="country">Country</button>
  
  <li>
    <button role="treeitem" aria-describedby="earth">Earth</button>
    <span aria-hidden="true"></span>
    <span aria-hidden="true"></span><ul role="group">
      <li>
        <span aria-hidden="true" class="border-left border-bottom"></span>
        <button role="treeitem" aria-describedby="continent">Africa</button>
        <span aria-hidden="true"></span></li>
      <li>
        <span aria-hidden="true" class="border-left border-bottom"></span>
        <button role="treeitem" aria-describedby="continent">Antartica</button>
        <span aria-hidden="true"></span><ul role="group">
          <li>
            <span aria-hidden="true"></span>
            <span aria-hidden="true" class="border-left border-bottom"></span>
            <button role="treeitem" aria-describedby="country">Antarctica</button></li>
          <li>
            <span aria-hidden="true"></span>
            <span aria-hidden="true" class="border-left border-bottom"></span>
            <button role="treeitem" aria-describedby="country">France</button></li>
        </ul></li></ul>
</li></ul></section>`;

interface Props {
  table: string;
  treeDefinition: SpecifyResource;
  treeDefinitionItems: RA<SpecifyResource>;
}

/*
 * TODO: tree rank collapse
 * TODO: tree rank header row position sticky
 */

function TreeView({
  table,
  treeDefinition,
  treeDefinitionItems,
}: Readonly<Props>): JSX.Element {
  const ranks = treeDefinitionItems.map((treeDefinitionItem) =>
    treeDefinitionItem.get('rankid')
  );
  const baseUrl = `/api/specify_tree/${table}/${treeDefinition.id}/`;

  // Node sort order
  const sortOrderFieldName = `${table.toLowerCase()}.treeview_sort_field`;
  const sortField = getPref(sortOrderFieldName, 'name');

  async function getRows() {
    return fetch(`${baseUrl}null/${sortField}`)
      .then(async (response) => response.json())
      .then((rows) =>
        rows.map(
          ([
            nodeId,
            name,
            fullName,
            nodeNumber,
            highestNodeNumber,
            rankId,
            acceptedId,
            acceptedName,
            children,
            allCOs,
            directCOs,
          ]) => ({
            nodeId,
            name,
            fullName,
            nodeNumber,
            highestNodeNumber,
            rankId,
            acceptedId,
            acceptedName,
            children,
            allCOs,
            directCOs,
          })
        )
      );
  }

  return (
    <div className={className.containerFull}>
      <header className="gap-y-2 flex">
        <h2>{treeDefinition.get('name')}</h2>
        <Autocomplete
          source={async (value) => {
            const tree = defined(getModel(table));
            const collection = new tree.LazyCollection({
              filters: { name__istartswith: value, orderby: 'name' },
              domainfilter: true,
            });
            return collection.fetch().then(() =>
              Object.fromEntries(
                collection.models.map((node) => {
                  const rankDefinition = treeDefinitionItems.find(
                    (rank) => rank.get('rankid') === node.get('rankid')
                  );
                  const rankName =
                    rankDefinition?.get('title') ??
                    rankDefinition?.get('name') ??
                    node.get('name');
                  return [
                    node.get('fullname'),
                    { label: rankName as string, data: node },
                  ];
                })
              )
            );
          }}
          onChange={(_value, { data }) => {
            // TODO: listen to "onChange"
            console.log(data);
          }}
          inputProps={{
            className: 'tree-search',
            placeholder: treeText('searchTreePlaceholder'),
            title: treeText('searchTreePlaceholder'),
            'aria-label': treeText('searchTreePlaceholder'),
          }}
        />
        <span className="flex-1 -ml-2" />
        <menu className="contents">
          <li>
            <Button.Simple disabled>{commonText('query')}</Button.Simple>
          </li>
          <li>
            <Button.Simple disabled>{commonText('edit')}</Button.Simple>
          </li>
          <li>
            <Button.Simple disabled>{commonText('addChild')}</Button.Simple>
          </li>
          <li>
            <Button.Simple disabled>{commonText('move')}</Button.Simple>
          </li>
          <li>
            <Button.Simple disabled>{treeText('merge')}</Button.Simple>
          </li>
          <li>
            <Button.Simple disabled>{treeText('synonymize')}</Button.Simple>
          </li>
        </menu>
      </header>
      <div className="grid-table flex-1" role="table">
        <div role="rowgroup">
          <div role="row">
            {treeDefinitionItems.map((treeDefinitionItem, index) => (
              <div role="columnheader" key={index}>
                <Button.LikeLink>
                  {treeDefinitionItem.get<string | null>('title') ??
                    treeDefinitionItem.get<string>('name')}
                </Button.LikeLink>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default createBackboneView(TreeView);

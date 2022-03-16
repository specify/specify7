import React from 'react';

import Backbone from '../backbone';
import type { SpQueryField } from '../datamodel';
import type { AnySchema, SerializedResource } from '../datamodelutils';
import { format } from '../dataobjformatters';
import { load } from '../initialcontext';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import queryText from '../localization/query';
import type { FormMode, FormType } from '../parseform';
import { columnToFieldMapper } from '../parseselect';
import { QueryFieldSpec } from '../queryfieldspec';
import { fetchResource, idFromUrl } from '../resource';
import { schema } from '../schema';
import type { LiteralField, Relationship } from '../specifyfield';
import type { SpecifyModel } from '../specifymodel';
import { isResourceOfType } from '../specifymodel';
import { getTreeDefinitionItems, isTreeModel } from '../treedefinitions';
import type { RA } from '../types';
import { defined, filterArray } from '../types';
import { getValidationAttributes } from '../uiparse';
import { userInformation } from '../userinfo';
import { f } from '../wbplanviewhelper';
import whenAll from '../whenall';
import { Autocomplete } from './autocomplete';
import { Button, Input } from './basic';
import { useAsyncState, useResourceValue } from './hooks';
import { formatList } from './internationalization';
import { showDialog } from './modaldialog';
import { QueryComboBoxSearch } from './querycbxsearch';
import { ViewResource } from './resourceview';

const typeSearches = load<Element>(
  '/context/app.resource?name=TypeSearches',
  'application/xml'
);

function makeQuery({
  fieldName,
  value,
  treeData,
  typeSearch: { relatedModel },
  specialConditions,
}: {
  readonly fieldName: string;
  readonly value: string;
  readonly treeData: TreeData | false;
  readonly typeSearch: TypeSearch;
  readonly specialConditions: RA<SpecifyResource<SpQueryField>>;
}): SpecifyResource<SpQuery> {
  const query = new schema.models.SpQuery.Resource(
    {},
    { noBusinessRules: true }
  );
  query.set('name', 'Ephemeral QueryCBX query');
  query.set('contextName', relatedModel.name);
  query.set('contextTableId', relatedModel.tableId);
  query.set('selectDistinct', false);
  query.set('countOnly', null);
  query.set('specifyUser', userInformation.resource_uri);
  query.set('isFavorite', false);
  query.set('ordinal', null);
  // @ts-expect-error Setting non-standard field
  query.set('limit', 0);

  const searchField = QueryFieldSpec.fromPath([
    relatedModel.name,
    ...fieldName.split('.'),
  ])
    .toSpQueryField()
    .set('isDisplay', false)
    .set('sortType', 0)
    .set('startValue', typeof treeData === 'object' ? `%${value}` : value)
    .set('operStart', 15)
    .set('position', 0);
  searchField.noBusinessRules = true;

  const displayField = QueryFieldSpec.fromPath([relatedModel.name])
    .toSpQueryField()
    .set('isDisplay', true)
    .set('sortType', 1)
    .set('operStart', 0)
    .set('position', 1);
  displayField.noBusinessRules = true;

  query.set('fields', [searchField, displayField, ...specialConditions]);

  return query;
}

function getSpecialConditions({
  fieldName,
  value,
  collectionRelationships,
  treeData,
  typeSearch: { relatedModel },
}: {
  readonly fieldName: string;
  readonly value: string;
  readonly treeData: TreeData | false;
  readonly collectionRelationships: CollectionRelationships | false;
  readonly typeSearch: TypeSearch;
}) {
  const fields = [];
  if (isTreeModel(this.model.specifyModel.name.name)) {
    var tableId = this.model.specifyModel.tableId;
    var tableName = this.model.specifyModel.name.toLowerCase();
    var descFilterField;
    let pos = 2;
    // Add not-a-descendant condition
    if (this.model.id) {
      descFilterField = new schema.models.SpQueryField.Resource(
        {},
        { noBusinessRules: true }
      );
      descFilterField.set({
        fieldname: 'nodeNumber',
        stringid: `${tableId}.${tableName}.nodeNumber`,
        tablelist: tableId,
        sorttype: 0,
        isrelfld: false,
        isdisplay: false,
        isnot: true,
        startvalue: `${this.model.get('nodenumber')},${this.model.get(
          'highestchildnodenumber'
        )}`,
        operstart: 9,
        position: pos++,
      });
      fields.push(descFilterField);
    }
    if (this.fieldName === 'parent') {
      // Add rank limits
      let nextRankId;
      if (treeRanks != null) {
        let r;
        if (this.model.get('rankid'))
          // Original value, not updated with unsaved changes {
          r = _.findIndex(treeRanks, (rank) => {
            return rank.rankid == this.model.get('rankid');
          });
        nextRankId = 0;
        if (r && r != -1) {
          for (
            var i = r + 1;
            i < treeRanks.length && !treeRanks[i].isenforced;
            i++
          );
          nextRankId = treeRanks[i - 1].rankid;
        }
      }
      const lastTreeRankId = _.last(treeRanks).rankid;

      const lowestRankId = Math.min(
        lastTreeRankId,
        nextRankId || lastTreeRankId,
        lowestChildRank || lastTreeRankId
      );
      if (lowestRankId != 0) {
        descFilterField = new schema.models.SpQueryField.Resource(
          {},
          { noBusinessRules: true }
        );
        descFilterField.set({
          fieldname: 'rankId',
          stringid: `${tableId}.${tableName}.rankId`,
          tablelist: tableId,
          sorttype: 0,
          isrelfld: false,
          isdisplay: false,
          isnot: false,
          startvalue: lowestRankId,
          operstart: 3,
          position: pos++,
        });
        fields.push(descFilterField);
      }
    } else if (this.fieldName === 'acceptedParent') {
      // Nothing to do
    } else if (
      this.fieldName === 'hybridParent1' ||
      this.fieldName === 'hybridParent2'
    ) {
      // Nothing to do
    }
  }

  if (this.model.specifyModel.name.toLowerCase() === 'collectionrelationship') {
    const subview = this.$el.parents().filter('td.specify-subview').first();
    const relName = subview.attr('data-specify-field-name');
    if (this.fieldName === 'collectionRelType') {
      // Add condition for current collection
      tableId = this.relatedModel.tableId;
      tableName = this.relatedModel.name.toLowerCase();
      descFilterField = new schema.models.SpQueryField.Resource(
        {},
        { noBusinessRules: true }
      );
      descFilterField.set({
        fieldname: 'collectionRelTypeId',
        stringid: `${tableId}.${tableName}.collectionRelTypeId`,
        tablelist: tableId,
        sorttype: 0,
        isrelfld: false,
        isdisplay: false,
        isnot: false,
        startvalue: _.pluck(
          relName === 'leftSideRels' ? leftSideRels : rightSideRels,
          'relid'
        ).toString(),
        operstart: 10,
        position: 2,
      });
      fields.push(descFilterField);
    } else {
      const relCollId = this.getRelatedCollectionId(
        leftSideRels,
        rightSideRels
      );
      if (relCollId) {
        this.forceCollection = { id: relCollId };
      }
    }
  }
  return fields;
}

type TreeData = {
  readonly lowestChildRank: number | undefined;
  readonly treeRanks: RA<{
    readonly rankId: number;
    readonly isEnforced: boolean;
  }>;
};

type CollectionRelationships = {
  readonly left: RA<{
    readonly id: number;
    readonly rightId: number | undefined;
  }>;
  readonly right: RA<{
    readonly id: number;
    readonly leftId: number | undefined;
  }>;
};

type TypeSearch = {
  readonly title: string;
  readonly searchFields: RA<LiteralField | Relationship>;
  readonly searchFieldsNames: RA<string>;
  readonly relatedModel: SpecifyModel;
};

export function QueryComboBox({
  id,
  resource,
  fieldName,
  mode,
  formType,
  isRequired,
  hasCloneButton = false,
  typeSearch: typeSearchName,
  forceCollection,
  relatedModel: initialRelatedModel,
}: {
  readonly id: string | undefined;
  readonly resource: SpecifyResource<AnySchema>;
  readonly fieldName: string | undefined;
  readonly mode: FormMode;
  readonly formType: FormType;
  readonly isRequired: boolean;
  readonly hasCloneButton?: boolean;
  readonly typeSearch: string | undefined;
  readonly forceCollection: number | undefined;
  readonly relatedModel: SpecifyModel | undefined;
}): JSX.Element {
  const field = resource.specifyModel.getField(fieldName ?? '');

  React.useEffect(() => {
    if (resource.isNew()) {
      if (
        isResourceOfType(resource, 'CollectionObject') &&
        field?.name === 'cataloger'
      )
        resource.set('cataloger', userInformation.agent.resource_uri);
      if (
        isResourceOfType(resource, 'LoanReturnPreparation') &&
        field?.name === 'receivedBy'
      )
        resource.set('receivedBy', userInformation.agent.resource_uri);
    }
  }, [resource, field]);

  const [treeData] = useAsyncState<TreeData | false>(
    React.useCallback(() => {
      if (isTreeModel(resource.specifyModel.name)) {
        if (field?.name == 'parent') {
          let lowestChildRank;
          if (resource.isNew()) lowestChildRank = Promise.resolve(undefined);
          else {
            const children = new resource.specifyModel.LazyCollection({
              filters: {
                parent_id: resource.id,
                orderby: 'rankId',
              },
            });
            lowestChildRank = children
              .fetchPromise({ limit: 1 })
              .then(({ models }) => models[0]?.get('rankId'));
          }
          const treeRanks = getTreeDefinitionItems(
            resource.specifyModel.name,
            false
          ).map((rank) => ({
            rankId: rank.rankId,
            isEnforced: rank.isEnforced ?? false,
          }));
          return lowestChildRank.then((rank) => ({
            lowestChildRank: rank,
            treeRanks,
          }));
        } else if (field?.name == 'acceptedParent') {
          // Don't need to do anything. Form system prevents lookups/edits
        } else if (
          field?.name == 'hybridParent1' ||
          field?.name == 'hybridParent2'
        ) {
          /*
           * No idea what restrictions there should be, the only obviously
           * required one - that a taxon is not a hybrid of itself, seems to
           * already be enforced
           */
        }
      }
      return false;
    }, [resource, field])
  );

  const [collectionRelationships] = useAsyncState<
    CollectionRelationships | false
  >(
    React.useCallback(() => {
      if (!isResourceOfType(resource, 'CollectionRelationship')) return false;
      const left = new schema.models.CollectionRelType.LazyCollection({
        filters: { leftsidecollection_id: schema.domainLevelIds.collection },
      });
      const right = new schema.models.CollectionRelType.LazyCollection({
        filters: { rightsidecollection_id: schema.domainLevelIds.collection },
      });
      return Promise.all([
        left.fetchPromise().then(({ models }) =>
          models.map((relationship) => ({
            id: relationship.id,
            rightId: idFromUrl(relationship.get('rightSideCollection') ?? ''),
          }))
        ),
        right.fetchPromise().then(({ models }) =>
          models.map((relationship) => ({
            id: relationship.id,
            leftId: idFromUrl(relationship.get('leftSideCollection') ?? ''),
          }))
        ),
      ]).then(([left, right]) => ({ left, right }));
    }, [resource])
  );

  const [typeSearch] = useAsyncState<TypeSearch | false>(
    React.useCallback(
      () =>
        typeof typeSearchName === 'string'
          ? typeSearches.then((element) => {
              const typeSearch = element.querySelector(
                `[name="${typeSearchName}]`
              );

              const relatedModel =
                initialRelatedModel ??
                (field?.isRelationship === true
                  ? field.relatedModel
                  : undefined);

              if (typeof relatedModel === 'undefined') return false;

              const searchFieldsNames =
                typeSearch
                  ?.getAttribute('searchField')
                  ?.split(',')
                  .map(f.trim)
                  .map(
                    typeof typeSearch?.textContent === 'string'
                      ? columnToFieldMapper(typeSearch.textContent)
                      : f.id
                  ) ?? [];
              const searchFields = searchFieldsNames.map((searchField) =>
                defined(relatedModel.getField(searchField))
              );

              const fieldTitles = searchFields.map((field) =>
                filterArray([
                  field.model === relatedModel ? undefined : field.model.label,
                  field.label,
                ]).join(' / ')
              );

              return {
                title: queryText('queryBoxDescription')(
                  formatList(fieldTitles)
                ),
                searchFields,
                searchFieldsNames,
                relatedModel,
              };
            })
          : false,
      [typeSearchName, field, initialRelatedModel]
    )
  );

  const isLoaded =
    typeof treeData !== 'undefined' &&
    typeof collectionRelationships !== 'undefined' &&
    typeof typeSearch !== 'undefined';
  const { value, updateValue, validationRef, parser } = useResourceValue(
    resource,
    field?.name,
    undefined
  );

  return (
    <div className="flex items-center">
      <Autocomplete
        source={async (value) => {
          if (!isLoaded || typeSearch === false) return [];
          const queries = typeSearch.searchFieldsNames.map((fieldName) =>
            makeQuery({
              fieldName,
              value,
              collectionRelationships,
              treeData,
              typeSearch,
            })
          );
          if (typeof forceCollection === 'number')
            queries.map((query) => query.set('collectionId', forceCollection));
          const requests = _.map(queries, function (query) {
            return $.post(
              '/stored_query/ephemeral/',
              JSON.stringify(query)
            ).pipe(function (data) {
              return data;
            });
          });
          whenAll(requests).pipe(siht.processResponse.bind(siht)).done(resolve);
        }}
        onChange={(value): void => updateValue(value)}
      >
        {(props) => (
          <Input.Text
            id={id}
            value={value?.toString() ?? ''}
            forwardRef={validationRef}
            className="flex-1"
            required={isRequired}
            readOnly={
              mode === 'view' ||
              formType === 'formtable' ||
              typeof typeSearch === 'undefined'
            }
            {...getValidationAttributes(parser)}
            {...props}
          />
        )}
      </Autocomplete>
      <span className="print:hidden contents">
        {mode === 'view' ? (
          formType === 'formtable' ? undefined : (
            <Button.Icon
              aria-pressed="false"
              title={commonText('view')}
              aria-label={commonText('view')}
              icon="eye"
            />
          )
        ) : (
          <>
            <Button.Icon
              aria-pressed="false"
              title={commonText('edit')}
              aria-label={commonText('edit')}
              icon="pencil"
            />
            <Button.Icon
              aria-pressed="false"
              title={commonText('add')}
              aria-label={commonText('add')}
              icon="plus"
            />
            {hasCloneButton && (
              <Button.Icon
                aria-pressed="false"
                title={formsText('clone')}
                aria-label={formsText('clone')}
                icon="clipboard"
              />
            )}
            <Button.Icon
              aria-pressed="false"
              title={commonText('search')}
              aria-label={commonText('search')}
              icon="search"
            />
          </>
        )}
      </span>
    </div>
  );
}

export default Backbone.View.extend({
  events: {
    'click .querycbx-edit, .querycbx-display': 'displayRelated',
    'click .querycbx-add': 'addRelated',
    'click .querycbx-clone': 'cloneRelated',
    'click .querycbx-search': 'openSearch',
    'change input': 'select',
    'blur input': 'blur',
  },
  getRelatedCollectionId(leftSideRels, rightSideRels) {
    if (
      this.model.specifyModel.name.toLowerCase() === 'collectionrelationship' &&
      (this.fieldName === 'rightSide' || this.fieldName === 'leftSide')
    ) {
      const rels =
        this.fieldName === 'rightSide' ? leftSideRels : rightSideRels;
      const relTypeId = idFromUrl(this.model.get('collectionreltype'));
      const rel = rels.find(function (i) {
        return i.relid == relTypeId;
      });
      return rel.rightsidecollectionid;
    }
    return null;
  },
  select(_event) {
    const resource = this.autocompleteRecords?.[event.target.value];
    this.model.set(this.fieldName, resource ?? null);
  },
  processResponse(responses) {
    this.autocompleteRecords = {};
    return responses
      .flatMap(({ results }) => results)
      .map((result) => {
        this.autocompleteRecords[result[1]] = new this.relatedModel.Resource({
          id: result[0],
        });
        return result[1];
      });
  },
  fillIn() {
    setTimeout(() => {
      this.model.rget(this.fieldName, true).done((related) => {
        this.$('.querycbx-edit, .querycbx-display, .querycbx-clone').prop(
          'disabled',
          !related
        );
        if (related)
          this.renderItem(related).then((item) =>
            this.$('input').val(item.value)
          );
        else this.$('input').val('');
      });
    }, 0);
  },
  async renderItem(resource) {
    return format(resource, this.typesearch.attr('dataobjformatter')).then(
      function (formatted) {
        return { label: formatted, value: formatted, resource };
      }
    );
  },
  openSearch(event) {
    const self = this;
    event.preventDefault();

    event.target.ariaPressed = true;

    if (self.dialog) {
      // If the open dialog is for search just close it and don't open a new one
      const closeOnly = self.dialog.hasClass('querycbx-dialog-search');
      self.dialog.remove();
      if (closeOnly) return;
    }
    const searchTemplateResource = new this.relatedModel.Resource(
      {},
      {
        noBusinessRules: true,
        noValidation: true,
      }
    );

    $.when(
      this.lowestChildRankPromise,
      this.leftSideRelsPromise,
      this.rightSideRelsPromise
    ).done(function (lowestChildRank, leftSideRels, rightSideRels) {
      const xtraConditions = self.getSpecialConditions(
        lowestChildRank,
        this.treeRanks,
        leftSideRels,
        rightSideRels
      );
      const extraFilters = [];
      /*
       * Send special conditions to dialog
       * extremely skimpy. will work only for current known cases
       */
      _.each(xtraConditions, function (x) {
        if (x.get('fieldname') === 'rankId') {
          extraFilters.push({
            field: 'rankId',
            operation: 'lessThan',
            value: [x.get('startValue')],
          });
        } else if (x.get('fieldname') === 'nodeNumber') {
          extraFilters.push({
            field: 'nodeNumber',
            op: 'unbetween',
            value: x.get('startValue').split(','),
          });
        } else if (x.get('fieldname') === 'collectionRelTypeId') {
          extraFilters.push({
            field: 'id',
            op: 'in',
            value: x.get('startValue').split(','),
          });
        } else {
          console.warn('extended filter not created for:', x);
        }
      });
      self.dialog = new QueryComboBoxSearch({
        forceCollection: self.forceCollection,
        extraFilters,
        resource: searchTemplateResource,
        onSelected: (resource) => self.model.set(self.fieldName, resource),
        onClose: () => self.dialog.remove(),
      }).render();
    });
  },
  displayRelated(event) {
    event.preventDefault();
    $.when(this.leftSideRelsPromise, this.rightSideRelsPromise).done(
      (leftSideRels, rightSideRels) => {
        const relCollId = this.getRelatedCollectionId(
          leftSideRels,
          rightSideRels
        );
        const collections = userInformation.available_collections.map(
          (c) => c[0]
        );
        if (relCollId && !collections.includes(relCollId))
          fetchResource('Collection', relCollId).then((collection) => {
            const dialog = showDialog({
              title: commonText('collectionAccessDeniedDialogTitle'),
              header: commonText('collectionAccessDeniedDialogHeader'),
              content: commonText('collectionAccessDeniedDialogMessage')(
                collection.collectionName ?? ''
              ),
              onClose: () => dialog.remove(),
              buttons: commonText('close'),
            });
          });
        else {
          this.closeDialogIfAlreadyOpen();
          const uri = this.model.get(this.fieldName);
          if (!uri) return;
          const related = this.relatedModel.Resource.fromUri(uri);
          this.openDialog('display', related);
        }
      }
    );
  },
  addRelated(event) {
    event.preventDefault();
    const mode = 'add';
    this.closeDialogIfAlreadyOpen();

    const related = new this.relatedModel.Resource();
    this.openDialog(mode, related);
  },
  cloneRelated(event) {
    event.preventDefault();
    const mode = 'clone';
    this.closeDialogIfAlreadyOpen();

    const uri = this.model.get(this.fieldName);
    if (!uri) return;
    const related = this.relatedModel.Resource.fromUri(uri);
    related
      .fetch()
      .pipe(function () {
        return related.clone();
      })
      .done(this.openDialog.bind(this, mode));
  },
  closeDialogIfAlreadyOpen() {
    this.$el.find('button').attr('aria-pressed', false);
    this.dialog?.remove();
  },
  openDialog(mode, related) {
    const buttonsQuery = ['edit', 'display'].includes(mode)
      ? 'button.querycbx-edit, button.querycbx-display'
      : `button.querycbx-${mode}`;
    this.$el.find(buttonsQuery).attr('aria-pressed', true);
    this.dialog = $('<div>', { class: `querycbx-dialog-${mode}` });

    this.dialog = new ViewResource({
      el: this.dialog,
      dialog: 'nonModal',
      resource: related,
      mode: this.readOnly ? 'view' : 'edit',
      canAddAnother: false,
      onSaved: this.resourceSaved.bind(this, related),
      onDeleted: this.resourceDeleted.bind(this),
      onClose: () => this.closeDialogIfAlreadyOpen(),
    }).render();
  },
  resourceSaved(related) {
    this.dialog?.remove();
    this.model.set(this.fieldName, related);
    this.fillIn();
  },
  resourceDeleted() {
    this.dialog?.remove();
    this.model.set(this.fieldName, null);
    this.fillIn();
  },
  blur() {
    const value = this.$('input').val().trim();
    if (value === '' && !this.isRequired) {
      this.model.set(this.fieldName, null);
    } else {
      this.fillIn();
    }
  },
});

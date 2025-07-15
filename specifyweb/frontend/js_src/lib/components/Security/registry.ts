import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import { userText } from '../../localization/user';
import { f } from '../../utils/functools';
import type { IR, R, RA } from '../../utils/types';
import { ensure, localized } from '../../utils/types';
import { lowerToHuman } from '../../utils/utils';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { genericTables, tables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import {
  frontEndPermissions,
  institutionPermissions,
  operationPolicies,
  tableActions,
} from '../Permissions/definitions';
import {
  actionToLabel,
  anyResource,
  getAllActions,
  partsToResourceName,
  resourceNameToParts,
  tableNameToResourceName,
  tablePermissionsPrefix,
  toolPermissionPrefix,
} from './utils';

/**
 * Convert a part like ['table','locality'] to an array of information for
 * each item
 */
export const getRegistriesFromPath = (
  resourceParts: RA<string>
): RA<IR<Registry> | undefined> =>
  resourceParts.reduce<RA<IR<Registry> | undefined>>(
    (parts, part) => [...parts, parts.at(-1)?.[part]?.children],
    [buildRegistry()]
  );

export type Registry = {
  readonly label: LocalizedString;
  readonly children: IR<Registry>;
  readonly actions: RA<string>;
  readonly groupName: LocalizedString;
  readonly isInstitutional: boolean;
};

type WritableRegistry = {
  readonly label: LocalizedString;
  readonly children: R<WritableRegistry>;
  readonly actions: RA<string>;
  readonly groupName: LocalizedString;
  // eslint-disable-next-line functional/prefer-readonly-type
  isInstitutional: boolean;
};

export const isUncommonPermissionTable = ({
  isSystem,
  isHidden,
}: SpecifyTable): boolean => isSystem || isHidden;

/** Build a registry of all permissions, their labels and possible actions */
const buildRegistry = f.store((): IR<Registry> => {
  const rules: RA<{
    readonly resource: string;
    readonly localized: RA<LocalizedString>;
    readonly actions: RA<string>;
    readonly groupName: LocalizedString;
  }> = [
    ...Object.values(genericTables)
      .filter(({ name }) => !f.has(toolTables(), name))
      .map((table) => ({
        resource: tableNameToResourceName(table.name),
        localized: [schemaText.table(), table.label],
        actions: tableActions,
        groupName: localized(
          isUncommonPermissionTable(table) ? userText.advancedTables() : ''
        ),
      })),
    ...Object.entries(toolDefinitions()).map(([name, { label }]) => ({
      resource: partsToResourceName([toolPermissionPrefix, name]),
      localized: [commonText.tool(), label],
      actions: tableActions,
      groupName: localized(''),
    })),
    ...Object.entries(operationPolicies).map(([resource, actions]) => ({
      resource,
      localized: resourceNameToParts(resource).map(lowerToHuman),
      actions,
      groupName: localized(''),
    })),
    ...Object.entries(frontEndPermissions).map(([resource, actions]) => ({
      resource,
      localized: resourceNameToParts(resource).map(lowerToHuman),
      actions,
      groupName: localized(''),
    })),
  ];
  return rules.reduce<R<WritableRegistry>>(
    (registry, { resource, localized: localizedItems, groupName }) => {
      const resourceParts = resourceNameToParts(resource);
      resourceParts.reduce<R<WritableRegistry>>(
        (place, part, index, { length }) => {
          place[part] ??= {
            label: localizedItems[index],
            children:
              index + 1 === length
                ? {}
                : {
                    [anyResource]: {
                      label: tablePermissionsPrefix.includes(part)
                        ? userText.allTables()
                        : commonText.all(),
                      children: {},
                      actions: getAllActions(
                        partsToResourceName(resourceParts.slice(0, index + 1))
                      ),
                      groupName: localized(''),
                      isInstitutional: false,
                    },
                  },
            groupName: localized(index + 1 === length ? groupName : ''),
            actions:
              index + 1 === length
                ? getAllActions(
                    partsToResourceName(resourceParts.slice(0, index + 1))
                  )
                : [],
            isInstitutional: true,
          };
          if (!institutionPermissions.has(resource))
            place[part].isInstitutional = false;
          return place[part].children;
        },
        registry
      );
      return registry;
    },
    {
      [anyResource]: {
        label: commonText.all(),
        children: {},
        actions: getAllActions(partsToResourceName([])),
        groupName: localized(''),
        isInstitutional: false,
      },
    }
  );
});

/**
 * Convert registry of policies to a TSV format.
 * May be used for documentation and development purposes
 */
export function policiesToTsv(): string {
  const iterate = (
    data: IR<Registry>,
    path: RA<string> = [],
    isInstitutional = false
  ): RA<RA<string>> =>
    Object.entries(data).flatMap(([key, entry]) =>
      key === '%'
        ? []
        : Object.keys(entry.children).length > 0
          ? iterate(
              entry.children,
              [...path, entry.label],
              isInstitutional || entry.isInstitutional
            )
          : entry.actions.map((action) => [
              [...path, entry.label].join(' > '),
              actionToLabel(action),
              isInstitutional || entry.isInstitutional
                ? 'Institution'
                : 'Collection',
              entry.groupName,
            ])
    );

  return [
    ['Path', 'Action', 'Scope', 'Group Name'],
    ...iterate(buildRegistry()),
  ]
    .map((row) => row.join('\t'))
    .join('\n');
}

/**
 * Consolidate permissions for several system tables under a single label
 *
 * If user doesn't have some access to any of these tables, user does not
 * have access to a tool
 */
export const toolDefinitions = f.store(() =>
  ensure<
    IR<{
      readonly label: string;
      readonly tables: RA<keyof Tables>;
    }>
  >()({
    schemaConfig: {
      label: schemaText.schemaConfig(),
      tables: ['SpLocaleContainer', 'SpLocaleContainerItem', 'SpLocaleItemStr'],
    },
    queryBuilder: {
      label: queryText.queryBuilder(),
      tables: ['SpQuery', 'SpQueryField'],
    },
    recordSets: {
      label: commonText.recordSets(),
      tables: ['RecordSet', 'RecordSetItem'],
    },
    resources: {
      label: resourcesText.appResources(),
      tables: [
        'SpAppResource',
        'SpAppResourceData',
        'SpAppResourceDir',
        'SpViewSetObj',
      ],
    },
    pickLists: {
      label: tables.PickList.label,
      tables: ['PickList', 'PickListItem'],
    },
    auditLog: {
      label: tables.SpAuditLog.label,
      tables: ['SpAuditLog', 'SpAuditLogField'],
    },
  } as const)
);

export const toolTables = f.store(
  () =>
    new Set(Object.values(toolDefinitions()).flatMap(({ tables }) => tables))
);

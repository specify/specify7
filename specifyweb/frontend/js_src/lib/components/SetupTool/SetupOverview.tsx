import React from 'react';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { checkFormCondition } from './SetupForm';
import type { FieldConfig } from './setupResources';
import { resources } from './setupResources';
import type { ResourceFormData } from './types';

/**
 * Displays all previously filled out forms in a grid format.
 */
export function SetupOverview({
  formData,
  currentStep,
}: {
  readonly formData: ResourceFormData;
  readonly currentStep: number;
}): JSX.Element {
  return (
    <div className="space-y-4 max-h-[70vh] overflow-auto ">
      <table className="w-full text-sm border-collapse table-auto rounded-md bg-white dark:bg-neutral-800">
        <colgroup>
          <col style={{ width: '60%' }} />
          <col style={{ width: '40%' }} />
        </colgroup>
        <tbody className="divide-y divide-gray-500">
          {resources.map((resource, step) => {
            // Display only the forms that have been visited.
            if (
              (Object.keys(formData[resource.resourceName]).length > 0 ||
                step <= currentStep) &&
              checkFormCondition(formData, resource)
            ) {
              // Decide how to render each field.
              const fieldDisplay = (
                field: FieldConfig,
                parentName?: string
              ) => {
                const fieldName =
                  parentName === undefined
                    ? field.name
                    : `${parentName}.${field.name}`;
                const rawValue = formData[resource.resourceName]?.[fieldName];
                let value = rawValue?.toString() ?? '-';
                if (field.type === 'object') {
                  // Construct a sub list of properties
                  field.fields?.map((child_field) =>
                    fieldDisplay(child_field, fieldName)
                  );
                  return (
                    <React.Fragment
                      key={`${resource.resourceName}-${field.name}`}
                    >
                      <tr key={`${resource.resourceName}`}>
                        <td className="font-medium py-1 pr-2 pl-2" colSpan={2}>
                          {field.label}
                        </td>
                      </tr>
                      {field.fields?.map((child) => (
                        <React.Fragment
                          key={`${resource.resourceName}-${fieldName}-${child.name}`}
                        >
                          {fieldDisplay(
                            child,
                            parentName
                              ? `${parentName}.${field.name}`
                              : field.name
                          )}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  );
                } else if (field.type === 'password') {
                  value = rawValue ? '***' : '-';
                } else if (
                  field.type === 'select' &&
                  Array.isArray(field.options)
                ) {
                  const match = field.options.find(
                    (option) => String(option.value) === value
                  );
                  value = match ? (match.label ?? match.value) : value;
                } else if (field.type === 'boolean') {
                  value = rawValue === true ? queryText.yes() : commonText.no();
                } else if (field.type === 'tree') {
                  value =
                    typeof rawValue === 'object' ? String(rawValue.title) : '-';
                }
                return (
                  <tr key={`${resource.resourceName}-${field.name}`}>
                    <td className={`py-1 pr-2 ${parentName ? 'pl-5' : 'pl-2'}`}>
                      {field.label}
                    </td>
                    <td className="py-1 pl-2 border-l border-gray-500">
                      {value}
                    </td>
                  </tr>
                );
              };
              return (
                <React.Fragment key={resource.resourceName}>
                  <tr key={`${resource.resourceName}`}>
                    <td
                      className="font-bold py-1 pr-2 pl-2 bg-gray-200 dark:bg-neutral-700"
                      colSpan={2}
                    >
                      {resource.label}
                    </td>
                  </tr>
                  {resource.fields.map((field) => fieldDisplay(field))}
                </React.Fragment>
              );
            }
            return undefined;
          })}
        </tbody>
      </table>
    </div>
  );
}

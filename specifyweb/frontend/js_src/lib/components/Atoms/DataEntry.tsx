import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { RA } from '../../utils/types';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { ViewDescription } from '../FormParse';
import { Button } from './Button';
import { className } from './className';
import type { icons } from './Icons';
import { Link } from './Link';
import type { TagProps } from './wrapper';
import { wrap } from './wrapper';

const dataEntryButton = (
  className: string,
  title: LocalizedString,
  icon: keyof typeof icons
) =>
  function (
    props: Omit<TagProps<'button'>, 'children' | 'type'> & {
      readonly onClick:
        | ((event: React.MouseEvent<HTMLButtonElement>) => void)
        | undefined;
    }
  ): JSX.Element {
    return (
      <Button.Icon
        className={`${className} ${props.className ?? ''}`}
        icon={icon}
        title={title}
        {...props}
      />
    );
  };

export const columnDefinitionsToCss = (
  columns: RA<number | undefined>,
  flexibleColumnWidth: boolean
): string =>
  columns
    .map((width) =>
      typeof width === 'number'
        ? `${width}${flexibleColumnWidth ? 'fr' : 'px'}`
        : 'auto'
    )
    .join(' ');

/**
 * Components for Specify Form
 * This is called DataEntry instead of Form because "Form" is already taken
 */
/* eslint-disable @typescript-eslint/naming-convention */
export const DataEntry = {
  Grid: wrap<
    'div',
    {
      readonly viewDefinition: ViewDescription;
      readonly flexibleColumnWidth: boolean;
      readonly display: 'block' | 'inline';
    }
  >(
    'DataEntry.Grid',
    'div',
    `items-center p-1 -ml-1 gap-2`,
    ({
      viewDefinition,
      display,
      className: classNameString = '',
      flexibleColumnWidth,
      style,
      ...props
    }) => ({
      className: `${
        display === 'inline' ? 'inline-grid' : 'grid'
      } ${classNameString}`,
      style: {
        gridTemplateColumns: columnDefinitionsToCss(
          viewDefinition.columns,
          flexibleColumnWidth
        ),
        ...style,
      },
      ...props,
    })
  ),
  Header: wrap('DataEntry.Header', 'header', className.formHeader),
  Title: wrap(
    'DataEntry.Title',
    'h2',
    `${className.headerPrimary} ${className.formTitle}`
  ),
  Cell: wrap<
    'div',
    {
      readonly colSpan: number;
      readonly align: string;
      readonly visible: boolean;
    }
  >(
    'DataEntry.Cell',
    'div',
    'flex flex-col',
    ({ colSpan, align, visible, ...props }) => ({
      ...props,
      style: {
        visibility: visible ? undefined : 'hidden',
        gridColumn:
          colSpan === 1 ? undefined : `span ${colSpan} / span ${colSpan}`,
        alignItems:
          align === 'right'
            ? 'flex-end'
            : align === 'center'
            ? 'center'
            : undefined,
        ...props.style,
      },
    })
  ),
  Footer: wrap('DataEntry.Footer', 'div', className.formFooter, {
    role: 'toolbar',
  }),
  SubForm: wrap('DataEntry.SubForm', 'fieldset', 'contents'),
  SubFormHeader: wrap(
    'DataEntry.SubFormHeader',
    'legend',
    'gap-2 flex font-bold border-b border-gray-500 pt-5 pb-1 items-center',
    ({ children, ...props }) => ({
      // A hack for Safari. See https://github.com/specify/specify7/issues/1535
      children: <span {...props}>{children}</span>,
    })
  ),
  SubFormTitle: wrap('DataEntry.SubFormTitle', 'h3', `${className.formTitle}`),
  Add: dataEntryButton(className.dataEntryAdd, commonText.add(), 'plus'),
  View: dataEntryButton(className.dataEntryView, commonText.view(), 'eye'),
  Edit: dataEntryButton(className.dataEntryEdit, commonText.edit(), 'pencil'),
  Clone: dataEntryButton(
    className.dataEntryClone,
    formsText.clone(),
    'clipboard'
  ),
  Search: dataEntryButton(
    className.dataEntrySearch,
    commonText.search(),
    'search'
  ),
  Remove: dataEntryButton(
    className.dataEntryRemove,
    commonText.remove(),
    'minus'
  ),
  Visit({
    className: localClassName = '',
    resource,
  }: {
    readonly className?: string;
    readonly resource: SpecifyResource<AnySchema> | undefined;
  }): JSX.Element | null {
    return typeof resource === 'object' && !resource.isNew() ? (
      <Link.NewTab
        aria-label={commonText.openInNewTab()}
        className={`${className.dataEntryVisit} ${localClassName}`}
        href={resource.viewUrl()}
        title={commonText.openInNewTab()}
      />
    ) : null;
  },
};
/* eslint-enable @typescript-eslint/naming-convention */

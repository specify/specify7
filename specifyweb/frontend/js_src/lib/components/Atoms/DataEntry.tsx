import { icons } from './Icons';
import { TagProps, wrap } from './wrapper';
import React from 'react';
import { RA } from '../../utils/types';
import { ViewDescription } from '../FormParse';
import { className } from './className';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { Button } from './Button';
import { Link } from './Link';
import {AnySchema} from '../DataModel/helperTypes';

const dataEntryButton = (
  className: string,
  title: string,
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
    `overflow-x-auto items-center p-1 -ml-1 gap-2`,
    ({
      viewDefinition,
      display,
      className: classNameString,
      flexibleColumnWidth,
      style,
      ...props
    }) => ({
      className: `${display === 'inline' ? 'inline-grid' : 'grid'} ${
        classNameString ?? ''
      } ${viewDefinition.columns.length === 1 ? className.limitedWidth : ''}`,
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
  Footer: wrap('FormFooter', 'div', className.formFooter, {
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
  Add: dataEntryButton(className.dataEntryAdd, commonText('add'), 'plus'),
  View: dataEntryButton(className.dataEntryView, commonText('view'), 'eye'),
  Edit: dataEntryButton(className.dataEntryEdit, commonText('edit'), 'pencil'),
  Clone: dataEntryButton(
    className.dataEntryClone,
    formsText('clone'),
    'clipboard'
  ),
  Search: dataEntryButton(
    className.dataEntrySearch,
    commonText('search'),
    'search'
  ),
  Remove: dataEntryButton(
    className.dataEntryRemove,
    commonText('remove'),
    'minus'
  ),
  Visit({
    resource,
    props,
  }: {
    readonly props?: Exclude<TagProps<'a'>, 'aria-label' | 'href' | 'title'>;
    readonly resource: SpecifyResource<AnySchema> | undefined;
  }): JSX.Element | null {
    return typeof resource === 'object' && !resource.isNew() ? (
      <Link.NewTab
        {...props}
        aria-label={formsText('visit')}
        className={`${className.dataEntryVisit} ${props?.className ?? ''}`}
        href={resource.viewUrl()}
        title={formsText('visit')}
      />
    ) : null;
  },
};
/* eslint-enable @typescript-eslint/naming-convention */

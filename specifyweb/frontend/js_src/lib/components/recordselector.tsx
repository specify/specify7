import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import * as navigation from '../navigation';
import QueryCbxSearch from '../querycbxsearch';
import type { Relationship } from '../specifyfield';
import type { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { defined } from '../types';
import { f } from '../wbplanviewhelper';
import { Button, FormFooter, Input, Link, SubFormHeader } from './basic';
import { crash } from './errorboundary';
import { Dialog } from './modaldialog';
import type { FormType } from './resourceview';
import { ResourceView } from './resourceview';

function Buttons({
  onAdd: handleAdd,
  onDelete: handleDelete,
  onVisit: handleVisit,
}: {
  readonly onAdd: (() => void) | undefined;
  readonly onDelete: (() => void) | undefined;
  readonly onVisit: (() => void) | undefined;
}): JSX.Element {
  return (
    <>
      {typeof handleDelete === 'function' && (
        <Button.LikeLink onClick={handleAdd}>
          {commonText('delete')}
        </Button.LikeLink>
      )}
      {typeof handleAdd === 'function' && (
        <Button.LikeLink onClick={handleDelete}>
          {commonText('new')}
        </Button.LikeLink>
      )}
      {typeof handleVisit === 'function' && (
        <Button.LikeLink onClick={handleVisit}>
          {formsText('visit')}
        </Button.LikeLink>
      )}
    </>
  );
}

function Slider({
  value,
  max,
  onChange: handleChange,
}: {
  readonly value: number;
  readonly max: number;
  readonly onChange: (newValue: number) => void;
}): JSX.Element {
  React.useEffect(
    () => (value > max ? handleChange(max) : undefined),
    [max, value]
  );
  return (
    <div
      className={`gap-x-2 print:hidden flex justify-center ${
        max > 1 ? '' : 'invisible'
      }`}
    >
      <Button.Simple
        aria-label={formsText('firstRecord')}
        title={formsText('firstRecord')}
        type="button"
        disabled={value == 0}
        onClick={(): void => handleChange(0)}
      >
        ≪
      </Button.Simple>
      <Button.Simple
        className="dark:bg-neutral-500 px-4 bg-white"
        aria-label={formsText('previousRecord')}
        title={formsText('previousRecord')}
        type="button"
        disabled={value == 0}
        onClick={(): void => handleChange(value - 1)}
      >
        &lt;
      </Button.Simple>
      <div className="grid font-bold items-center grid-cols-[1fr_auto_1fr]">
        <label
          className={`h-full relative after:invisible after:p-2
            after:content-[attr(data-value)]`}
          data-value={value}
        >
          <span className="sr-only">{formsText('currentRecord')(max)}</span>
          <Input
            type="number"
            className="no-arrows dark:bg-neutral-600 absolute top-0 left-0 w-full h-full font-bold bg-white border-0"
            min="1"
            // TODO: test if this inhibits input:
            max={max}
            step="1"
            value={value}
          />
        </label>
        <span>/</span>
        <span>{max}</span>
      </div>
      <Button.Simple
        className="button dark:bg-neutral-500 px-4 bg-white"
        aria-label={formsText('nextRecord')}
        title={formsText('nextRecord')}
        disabled={value == max}
        onClick={(): void => handleChange(value + 1)}
      >
        &gt;
      </Button.Simple>
      <Button.Simple
        className="button"
        aria-label={formsText('lastRecord')}
        title={formsText('lastRecord')}
        disabled={value == max}
        onClick={(): void => handleChange(max)}
      >
        ≫
      </Button.Simple>
    </div>
  );
}

function Header({
  isDependent,
  title,
  length,
  buttons,
}: {
  readonly isDependent: boolean;
  readonly title: string;
  readonly length: number;
  readonly buttons: JSX.Element | undefined;
}): JSX.Element {
  return (
    <SubFormHeader>
      <legend>
        {!isDependent && (
          <Link.Icon
            icon="chevronRight"
            title={formsText('link')}
            aria-label={formsText('link')}
          />
        )}
        <span>{`${title} (${length})`}</span>
      </legend>
      {buttons}
    </SubFormHeader>
  );
}

function Search<SCHEMA extends AnySchema>({
  model,
  otherSideName,
  parentUrl,
  onAdd: handleAdd,
}: {
  readonly model: SpecifyModel<SCHEMA>;
  readonly otherSideName: string;
  readonly parentUrl: string;
  readonly onAdd: (resource: SpecifyResource<SCHEMA>) => void;
}): JSX.Element {
  React.useEffect(() => {
    if (containerRef.current === null) return;
    // TODO: rewrite to React
    const view = new QueryCbxSearch({
      el: containerRef.current,
      model: new model.Resource(
        {},
        {
          noBusinessRules: true,
          noValidation: true,
        }
      ),
      selected(resource: SpecifyResource<SCHEMA>) {
        resource.set(otherSideName, parentUrl as any);
        resource
          .save()
          .then(() => handleAdd(resource))
          .catch(crash);
      },
    }).render();
    return (): void => view.remove();
  }, [model, otherSideName, parentUrl]);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  return <div ref={containerRef} />;
}

export function RecordSelector<SCHEMA extends AnySchema>({
  isReadOnly: readOnly,
  model,
  formType = 'form',
  viewName,
  field,
  records,
  hasHeader,
  sliderPosition = 'bottom',
  onAdd: handleAdded,
  onDelete: handleDelete,
  onSlide: handleSlide,
  isDependent,
  defaultIndex,
  relatedResource,
}: {
  readonly isReadOnly: boolean;
  readonly model: SpecifyModel<SCHEMA>;
  readonly formType?: FormType;
  readonly viewName?: string;
  readonly field?: Relationship;
  readonly records: RA<SpecifyResource<SCHEMA>>;
  readonly hasHeader: boolean;
  readonly sliderPosition?: 'top' | 'bottom';
  readonly onAdd: undefined | ((resource: SpecifyResource<SCHEMA>) => void);
  readonly onDelete: (index: number) => void;
  readonly onSlide?: (index: number) => void;
  readonly relatedResource?: SpecifyResource<AnySchema>;
  readonly isDependent: boolean;
  readonly defaultIndex?: number;
}): JSX.Element {
  const isReadOnly = readOnly && !isDependent;

  const [index, setIndex] = React.useState(defaultIndex ?? records.length - 1);

  function updateIndex(index: number): void {
    setIndex(index);
    handleSlide?.(index);
  }

  const [state, setState] = React.useState<
    'main' | 'deleteDialog' | 'addBySearch'
  >();

  function handleAdd(): void {
    updateIndex(records.length);

    if (typeof handleAdded === 'undefined') return;

    if (isDependent) {
      const resource = new model.Resource();
      if (
        typeof field?.otherSideName === 'string' &&
        typeof relatedResource === 'object' &&
        !relatedResource.isNew()
      )
        resource.set(field.otherSideName, relatedResource.url() as any);
      handleAdded(resource);
    } else setState('addBySearch');
  }

  function handleRemove(): void {
    if (records.length === 0) return;
    updateIndex(Math.min(index, records.length - 2));

    if (isDependent) handleDelete(index);
    else setState('deleteDialog');
  }

  const slider = (
    <Slider value={index} max={records.length} onChange={updateIndex} />
  );

  const title = field?.label ?? model?.label;

  const buttons = isReadOnly ? undefined : (
    <Buttons
      onVisit={
        typeof records[index] === 'object' && !isDependent
          ? (): void => navigation.go(records[index].viewUrl())
          : undefined
      }
      onDelete={typeof records[index] === 'object' ? handleRemove : undefined}
      onAdd={handleAdd}
    />
  );

  const children = (
    <>
      {state === 'deleteDialog' ? (
        <Dialog
          title={title}
          header={formsText('removeRecordDialogHeader')}
          onClose={(): void => setState('main')}
          buttons={
            <>
              <Button.Red
                onClick={(): void => {
                  handleDelete(index);
                  setState('main');
                }}
              >
                {commonText('delete')}
              </Button.Red>
              <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
            </>
          }
        >
          {formsText('removeRecordDialogMessage')}
        </Dialog>
      ) : state === 'addBySearch' && typeof handleAdded === 'function' ? (
        <Search
          model={model}
          otherSideName={defined(field?.otherSideName)}
          parentUrl={defined(relatedResource).url()}
          onAdd={handleAdded}
        />
      ) : undefined}
      {sliderPosition === 'top' && slider}
      {hasHeader && (
        <Header
          length={records.length}
          title={title}
          buttons={buttons}
          isDependent={isDependent}
        />
      )}
      {records.length === 0 ? (
        <p>{formsText('noData')}</p>
      ) : (
        <ResourceView
          resource={records[index]}
          mode={isDependent && !isReadOnly ? 'edit' : 'view'}
          viewName={viewName}
          type={formType}
          hasHeader={false}
          hasButtons={false}
          canAddAnother={false}
          onClose={f.void}
        />
      )}
      {sliderPosition === 'bottom' && slider}
      {!hasHeader && <FormFooter>{buttons}</FormFooter>}
    </>
  );
  return hasHeader ? <fieldset>{children}</fieldset> : <div>{children}</div>;
}

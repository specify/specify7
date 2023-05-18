/**
 * Save Blocker is an error on resource that prevents it from being saved
 * and needs to be resolved by the user
 */

import type { R, RA } from '../../utils/types';
import { removeItem } from '../../utils/utils';
import { softError } from '../Errors/assert';
import type { AnySchema, TableFields } from './helperTypes';
import type { SpecifyResource } from './legacyTypes';

/*
 * Propagate a save blocker even for independent resources, because
 * resources rendered in a subview don't have a "Save" button of their own
 */
const triggerOnParent = (
  resource: SpecifyResource<AnySchema>
): SpecifyResource<AnySchema>['trigger'] | undefined =>
  resource.parent?.trigger.bind(resource.parent);

const triggerOnCollectionRelated = (
  resource: SpecifyResource<AnySchema>
): SpecifyResource<AnySchema>['trigger'] | undefined =>
  resource.collection?.related?.trigger.bind(resource.collection.related);

export type Blocker = {
  readonly resource: SpecifyResource<AnySchema>;
  readonly fieldName?: string;
  readonly reason: string;
  // Deferred blockers fire only when trying to save
  readonly deferred: boolean;
};

export type Input =
  | HTMLButtonElement
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

export class SaveBlockers<SCHEMA extends AnySchema> {
  private readonly resource: SpecifyResource<SCHEMA>;

  // eslint-disable-next-line functional/prefer-readonly-type
  public blockers: R<Blocker> = {};

  public readonly blockingResources = new Set<SpecifyResource<AnySchema>>();

  private readonly fieldListeners: Partial<
    Record<TableFields<SCHEMA>, RA<(blockers: RA<Blocker>) => boolean>>
  > = {};

  public constructor(resource: SpecifyResource<SCHEMA>) {
    this.resource = resource;
    this.resource.on('saveblocked', (blocker: Blocker) => {
      triggerOnParent(resource)?.('saveblocked', blocker);
      triggerOnCollectionRelated(resource)?.('saveblocked', blocker);
      if (!this.blockingResources.has(resource))
        resource.once('destroy', () => {
          this.blockingResources.delete(resource);
          resource.trigger('blockerschanged');
        });
      this.blockingResources.add(blocker.resource);
      resource.trigger('blockerschanged');
    });
    this.resource.on('oktosave destory', (source: SpecifyResource<SCHEMA>) => {
      triggerOnParent(resource)?.('oktosave', source);
      triggerOnCollectionRelated(resource)?.('oktosave', source);
      this.blockingResources.delete(source);
      resource.trigger('blockerschanged');
    });
    this.resource.on('remove', (source: SpecifyResource<SCHEMA>) => {
      triggerOnCollectionRelated(resource)?.('oktosave', source);
    });
  }

  public add(
    key: string,
    fieldName: (string & keyof SCHEMA['fields']) | undefined,
    reason: string,
    deferred = false
  ): void {
    this.blockers[key] = {
      resource: this.resource,
      fieldName: fieldName?.toLowerCase(),
      reason,
      deferred,
    };
    this.resource.trigger('blockerschanged');
    this.triggerSaveBlocked(this.blockers[key]);
  }

  private triggerSaveBlocked(blocker: Blocker): void {
    this.resource.trigger('saveblocked', blocker);
    if (typeof blocker.fieldName === 'string')
      this.resource.trigger(`saveblocked: ${blocker.fieldName}`, blocker);
  }

  public remove(key: string): void {
    const blocker = this.blockers[key];
    if (blocker === undefined) return;

    this.blockers = Object.fromEntries(
      Object.entries(this.blockers).filter(([blockerKey]) => blockerKey !== key)
    );

    if (
      typeof blocker.fieldName === 'string' &&
      this.blockersForField(blocker.fieldName).length === 0
    )
      this.resource.trigger(`nosaveblockers: ${blocker.fieldName}`);

    if (Object.keys(this.blockers).length === 0)
      this.resource.trigger('oktosave', this.resource);

    this.resource.trigger('blockerschanged');
  }

  public getFieldErrors(
    fieldName: string & keyof SCHEMA['fields']
  ): RA<string> {
    return Object.values(this.blockers)
      .filter((blocker) => blocker.fieldName === fieldName.toLowerCase())
      .map((blocker) => blocker.reason);
  }

  public blockersForField(
    fieldName: string & keyof SCHEMA['fields']
  ): RA<Blocker> {
    return Object.values(this.blockers).filter(
      (blocker) => blocker.fieldName === fieldName.toLowerCase()
    );
  }

  public fireDeferredBlockers(): void {
    this.blockers = Object.fromEntries(
      Object.entries(this.blockers).map(([key, blocker]) => {
        if (blocker.deferred) this.triggerSaveBlocked(blocker);
        return [key, { ...blocker, deferred: false }];
      })
    );
    this.resource.trigger('blockerschanged');
  }

  public hasOnlyDeferredBlockers(): boolean {
    return Object.values(this.blockers).every(({ deferred }) => deferred);
  }

  public blockingHasOnlyDeferredBlockers(): boolean {
    return Array.from(this.blockingResources ?? []).every((resource) =>
      resource.saveBlockers?.hasOnlyDeferredBlockers()
    );
  }

  // FIXME: use this in Save.tsx
  /**
   * Add business rule error listeners. Each callback can return a boolean
   * indicating whether error has been displayed to the user. If false is
   * returned, the generic error handler is used (usually an error dialog)
   */
  public addListener(
    field: TableFields<SCHEMA>,
    callback: (blockers: RA<Blocker>) => boolean
  ): () => void {
    this.fieldListeners[field] = [
      ...(this.fieldListeners[field] ?? []),
      callback,
    ];
    return (): void => {
      if (this.fieldListeners[field] === undefined) return;
      const firstIndex = this.fieldListeners[field]?.indexOf(callback) ?? -1;
      if (firstIndex === -1) softError('Unable to find callback to remove');
      else
        this.fieldListeners[field] = removeItem(
          this.fieldListeners[field]!,
          firstIndex
        );
    };
  }
}

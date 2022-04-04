import type { AnySchema } from './datamodelutils';
import type { SpecifyResource } from './legacytypes';
import type { R, RA } from './types';

// TODO: only propagate for dependent resources
function triggerOnParent(resource: SpecifyResource<AnySchema>) {
  return resource.parent?.trigger.bind(resource.parent);
}

function triggerOnCollectionRelated(resource: SpecifyResource<AnySchema>) {
  return resource.collection?.related?.trigger.bind(
    resource.collection.related
  );
}

export type Blocker = {
  readonly resource: SpecifyResource<AnySchema>;
  readonly fieldName?: string;
  readonly reason: string;
  // Deferred blockers fire only when trying to save
  readonly deferred: boolean;
};

export type Input = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export class SaveBlockers<SCHEMA extends AnySchema> {
  private readonly resource: SpecifyResource<SCHEMA>;

  public blockers: R<Blocker> = {};

  public readonly blockingResources: Set<SpecifyResource<AnySchema>> =
    new Set();

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
    fieldName: (keyof SCHEMA['fields'] & string) | undefined,
    reason: string,
    deferred = false
  ): void {
    this.blockers[key] = {
      resource: this.resource,
      fieldName: fieldName?.toLowerCase(),
      reason,
      deferred,
    };
    this.triggerSaveBlocked(this.blockers[key]);
  }

  private triggerSaveBlocked(blocker: Blocker): void {
    this.resource.trigger('saveblocked', blocker);
    if (typeof blocker.fieldName === 'string')
      this.resource.trigger(`saveblocked: ${blocker.fieldName}`, blocker);
  }

  public remove(key: string): void {
    const blocker = this.blockers[key];
    if (typeof blocker === 'undefined') return;

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
  }

  public getFieldErrors(
    fieldName: keyof SCHEMA['fields'] & string
  ): RA<string> {
    return Object.values(this.blockers)
      .filter((blocker) => blocker.fieldName === fieldName)
      .map((blocker) => blocker.reason);
  }

  public blockersForField(
    fieldName: keyof SCHEMA['fields'] & string
  ): RA<Blocker> {
    return Object.values(this.blockers).filter(
      (blocker) => blocker.fieldName === fieldName
    );
  }

  public fireDeferredBlockers(): void {
    this.blockers = Object.fromEntries(
      Object.entries(this.blockers).map(([key, blocker]) => {
        if (blocker.deferred) this.triggerSaveBlocked(blocker);
        return [key, { ...blocker, deferred: false }];
      })
    );
  }

  public hasOnlyDeferredBlockers(): boolean {
    return Object.values(this.blockers).every(({ deferred }) => deferred);
  }
}

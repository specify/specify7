import type { SpecifyResource } from './legacytypes';
import type { R, RA } from './types';
import { validationMessages } from './validationmessages';

// TODO: only propagate for dependent resources
function triggerOnParent(resource: SpecifyResource) {
  return resource.parent?.trigger.bind(resource.parent);
}

function triggerOnCollectionRelated(resource: SpecifyResource) {
  return resource.collection?.related?.trigger.bind(
    resource.collection.related
  );
}

export type Blocker = {
  readonly resource: SpecifyResource;
  readonly fieldName?: string;
  readonly reason: string;
  // Deferred blockers fire only when trying to save
  readonly deferred: boolean;
};

export type Input = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

type LinkedField = {
  el: Input;
  destructor: () => void;
};

export default class SaveBlockers {
  private readonly resource: SpecifyResource;

  public blockers: R<Blocker> = {};

  private inputs: R<LinkedField[]> = {};

  public readonly blockingResources: Set<SpecifyResource> = new Set();

  public constructor(resource: SpecifyResource) {
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
    this.resource.on('oktosave destory', (source: SpecifyResource) => {
      triggerOnParent(resource)?.('oktosave', source);
      triggerOnCollectionRelated(resource)?.('oktosave', source);
      this.blockingResources.delete(source);
      resource.trigger('blockerschanged');
    });
    this.resource.on('remove', (source: SpecifyResource) => {
      triggerOnCollectionRelated(resource)?.('oktosave', source);
    });
  }

  public add(
    key: string,
    fieldName: string | undefined,
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
    this.refreshValidation(this.blockers[key]);
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

    this.refreshValidation(blocker);
  }

  // Don't use this in React components. Prefer getFieldErrors with useValidation
  public linkInput(input: Input, fieldName: string): void {
    this.inputs[fieldName] ??= [];
    const update = this.handleFocus.bind(this, input, fieldName);
    input.addEventListener('focus', update);
    this.inputs[fieldName].push({
      el: input,
      destructor: () => input.removeEventListener('focus', update),
    });
    update();
  }

  private handleFocus(input: Input, fieldName: string): void {
    validationMessages(input, this.getFieldErrors(fieldName));
  }

  public getFieldErrors(fieldName: string): RA<string> {
    return Object.values(this.blockers)
      .filter((blocker) => blocker.fieldName === fieldName)
      .map((blocker) => blocker.reason);
  }

  public unlinkInput(targetInput: Input): void {
    this.inputs = Object.fromEntries(
      Object.entries(this.inputs).map(([fieldName, inputs]) => [
        fieldName,
        inputs.filter((input) => {
          if (input.el === targetInput) {
            input.destructor();
            return false;
          }
          return true;
        }),
      ])
    );
  }

  private refreshValidation(blocker: Blocker): void {
    const fieldName = blocker.fieldName;
    if (typeof fieldName === 'undefined') return;
    (this.inputs[fieldName] ?? []).forEach((input) =>
      validationMessages(
        input.el,
        this.blockersForField(fieldName).map((blocker) => blocker.reason) ?? []
      )
    );
  }

  public blockersForField(fieldName: string): RA<Blocker> {
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

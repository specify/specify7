import { RA } from '../../utils/types';
import { AnySchema } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { BlockerNode, DeleteBlockerState, ResourceIdentifier } from './state';

export class DeleteBlockerStore {
  private readonly state: DeleteBlockerState;

  private readonly listeners = new Set<() => void>();

  public constructor(
    blockerStateParams: ConstructorParameters<
      typeof DeleteBlockerState
    >[0] = undefined
  ) {
    const params: ConstructorParameters<typeof DeleteBlockerState>[0] = {
      ...blockerStateParams,
      onChange: () => {
        blockerStateParams?.onChange?.();
        this.notify();
      },
    };
    this.state = new DeleteBlockerState(params);
  }

  public readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  public notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  public async seedBlockers(resource: SpecifyResource<AnySchema>) {
    return this.state.seedBlockers(resource);
  }

  public getBlockerGraph(
    resource: SpecifyResource<AnySchema>
  ): RA<BlockerNode> {
    return this.state.getBlockerGraph(resource);
  }

  public getNode(nodeKey: ResourceIdentifier) {
    return this.state.getNode(nodeKey);
  }

  public clearState() {
    this.state.destroy();
  }
}

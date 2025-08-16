/**
 * Tree repair dialog
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useSearchParameter } from '../../hooks/navigation';
import { usePromise } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { treeText } from '../../localization/tree';
import { ajax } from '../../utils/ajax';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import { toLowerCase } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import { deserializeResource } from '../DataModel/serializers';
import { genericTables } from '../DataModel/tables';
import {
  getDisciplineTrees,
  getTreeDefinitions,
  treeRanksPromise,
} from '../InitialContext/treeRanks';
import { Dialog } from '../Molecules/Dialog';
import { Portal } from '../Molecules/Portal';
import { ResourceEdit } from '../Molecules/ResourceLink';
import { TableIcon } from '../Molecules/TableIcon';
import { hasPermission, hasTreeAccess } from '../Permissions/helpers';
import { formatUrl } from '../Router/queryString';
import { OverlayContext } from '../Router/Router';

const TREE_RESOURCES = {
  Taxon: '/tree/edit/taxon',
  Geography: '/tree/edit/geography',
  Storage: '/tree/edit/storage',
  GeologicTimePeriod: '/tree/edit/geologictimeperiod',
  LithoStrat: '/tree/edit/lithostrat',
  TectonicUnit: '/tree/edit/tectonicunit',
} as const;
type TreeNameKey = keyof typeof TREE_RESOURCES;

export function TreeSelectOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  return (
    <TreeSelectDialog
      getLink={(tree): string => `/specify/tree/${tree.toLowerCase()}/`}
      permissionName="read"
      title={treeText.trees()}
      onClick={undefined}
      onClose={handleClose}
    />
  );
}

export function TreeSelectDialog({
  onClose: handleClose,
  onClick: handleClick,
  title,
  getLink,
  permissionName,
  confirmationMessage,
}: {
  readonly onClose: () => void;
  readonly onClick: ((tree: string) => Promise<void> | void) | undefined;
  readonly title: LocalizedString;
  readonly confirmationMessage?: LocalizedString;
  readonly getLink: (tree: string) => string;
  readonly permissionName: 'read' | 'repair';
}): JSX.Element | null {
  const loading = React.useContext(LoadingContext);
  const [treeRanks] = usePromise(treeRanksPromise, true);
  const [isFinished, setIsFinished] = useBooleanState();

  const treeData = React.useMemo(
    () =>
      typeof treeRanks === 'object'
        ? getDisciplineTrees()
            .filter((treeName) =>
              permissionName === 'repair'
                ? hasPermission(`/tree/edit/${toLowerCase(treeName)}`, 'repair')
                : hasTreeAccess(treeName, 'read')
            )
            .map((treeName) => {
              const treeDefinitions = getTreeDefinitions(treeName);
              if (treeDefinitions.length === 0) {
                console.warn(`No tree definitions exist for ${treeName}`);
                return [treeName, undefined] as const;
              }

              const defaultTreeDefinition = deserializeResource(
                treeDefinitions[0].definition
              );
              return [treeName, defaultTreeDefinition] as const;
            })
        : undefined,
    [permissionName, treeRanks]
  );

  return typeof treeRanks === 'object' && Array.isArray(treeData) ? (
    <Dialog
      buttons={
        <Button.Secondary onClick={handleClose}>
          {isFinished ? commonText.close() : commonText.cancel()}
        </Button.Secondary>
      }
      header={title}
      icon={icons.tree}
      onClose={handleClose}
    >
      {isFinished ? (
        confirmationMessage
      ) : (
        <nav>
          <Ul className="flex flex-col gap-1">
            {treeData.map(([treeName, treeDefinition]) => (
              <li className="contents" key={treeName}>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-2 items-start">
                    <Link.Default
                      className="flex-1"
                      href={getLink(treeName)}
                      title={treeDefinition?.get('remarks') ?? undefined}
                      onClick={(event): void => {
                        if (handleClick === undefined) return;
                        event.preventDefault();
                        loading(
                          Promise.resolve(handleClick(treeName)).then(() =>
                            typeof confirmationMessage === 'string'
                              ? setIsFinished()
                              : handleClose()
                          )
                        );
                      }}
                    >
                      <TableIcon label={false} name={treeName} />
                      {genericTables[treeName].label}
                    </Link.Default>
                    {typeof treeDefinition === 'object' && (
                      <ResourceEdit
                        resource={treeDefinition}
                        onSaved={(): void => globalThis.location.reload()}
                      />
                    )}
                    {permissionName === 'repair' && (
                      <TreeActionsDropdown treeDefinition={treeDefinition} treeName={treeName} />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </Ul>
        </nav>
      )}
    </Dialog>
  ) : null;
}

function ActionsMenu({ treeName, treeDefinition }: { readonly treeName: string; readonly treeDefinition: any }): JSX.Element | null {
  const [result, setResult] = React.useState<{ readonly accepted: number; readonly synonyms: number; readonly total: number } | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [repairStatus, setRepairStatus] = React.useState<'idle' | 'success'>('idle');
  const [hoveredAction, setHoveredAction] = React.useState<'rebuildAccepted' | 'rebuildSynonyms' | 'repair' | null>(null);
  if (typeof treeDefinition !== 'object') return null;
  if (!(treeName in TREE_RESOURCES)) return null;
  const canRebuild = hasPermission(TREE_RESOURCES[treeName as TreeNameKey], 'rebuild_full_names');
  const canRepair = hasPermission(TREE_RESOURCES[treeName as TreeNameKey], 'repair');
  if (!canRebuild && !canRepair) return null;
  const id = treeDefinition.get('id');
  const trigger = (withSynonyms: boolean): void => {
    setIsRunning(true);
    setResult(null);
    setRepairStatus('idle');
    ajax<string | { readonly success: boolean; readonly rebuild_synonyms: boolean; readonly changed: { readonly accepted: number; readonly synonyms: number; readonly total: number } }>(
      `/api/specify_tree/${treeName.toLowerCase()}/${id}/rebuild-full-name${withSynonyms ? '?rebuild_synonyms=true' : ''}`,
      { method: 'POST', headers: { Accept: 'application/json' }, errorMode: 'dismissible' }
    )
      .then((resp) => {
        if (!resp) {
          setResult({ accepted: 0, synonyms: 0, total: 0 });
          return;
        }
        const rawData: any = (resp as any).data ?? resp;
        let parsed: any = rawData;
        if (typeof rawData === 'string') {
          try { parsed = JSON.parse(rawData); } catch { /* Ignore */ }
        }
        const changed = parsed?.changed;
        const accepted = changed?.accepted ?? 0;
        const synonyms = changed?.synonyms ?? 0;
        const total = changed?.total ?? accepted + synonyms;
        setResult({ accepted, synonyms, total });
      })
      .finally(() => setIsRunning(false));
  };
  const triggerRepair = (): void => {
    if (!canRepair) return;
    setIsRunning(true);
    setResult(null);
    setRepairStatus('idle');
    ping(`/api/specify_tree/${treeName.toLowerCase()}/repair/`, {
      method: 'POST',
      errorMode: 'dismissible',
    })
      .then(() => setRepairStatus('success'))
      .finally(() => setIsRunning(false));
  };
  type ActionKey = 'rebuildAccepted' | 'rebuildSynonyms' | 'repair';
  type ActionDef = {
    readonly key: ActionKey;
    readonly can: boolean;
    readonly label: () => LocalizedString;
    readonly description: () => LocalizedString;
    readonly run: () => void;
  }
  const actions: readonly ActionDef[] = [
    {
      key: 'repair',
      can: canRepair,
      label: () => headerText.repairTree(),
      description: () => treeText.repairTreeDescription(),
      run: triggerRepair,
    },
    {
      key: 'rebuildAccepted',
      can: canRebuild,
      label: () => treeText.rebuildNames(),
      description: () => treeText.rebuildNamesDescription(),
      run: () => trigger(false),
    },
    {
      key: 'rebuildSynonyms',
      can: canRebuild,
      label: () => treeText.rebuildNamesSynonyms(),
      description: () => treeText.rebuildNamesSynonymsDescription(),
      run: () => trigger(true),
    },
  ];
  const visibleActions = actions.filter((a) => a.can);

  let status: React.ReactNode = null;
  if (isRunning) status = <span className="text-xs">{commonText.working()}</span>;
  else if (result && canRebuild) {
    status = result.total > 0 ? (
      <div className="text-xs">
        {treeText.rebuildResult({ total: result.total, accepted: result.accepted, synonyms: result.synonyms })}
      </div>
    ) : (
  <div className="text-xs italic">{treeText.noFullNamesUpdated()}</div>
    );
  } else if (repairStatus === 'success' && (!canRebuild || !result)) {
    status = (
      <div className="text-xs text-green-600 dark:text-green-400">
  {headerText.treeRepairComplete()}
      </div>
    );
  } else if (hoveredAction) {
    const current = actions.find((a) => a.key === hoveredAction);
    status = current ? (
      <div className="text-xs leading-snug opacity-80">{current.description()}</div>
    ) : null;
  }
  return (
    <div className="flex flex-col gap-1 p-2 bg-[color:var(--background)] rounded">
      <div className="flex flex-col gap-2">
        {visibleActions.map((a) => (
          <Button.Secondary
            disabled={isRunning}
            key={a.key}
            onClick={(e): void => { e.preventDefault(); a.run(); }}
            onMouseEnter={(): void => setHoveredAction(a.key)}
            onMouseLeave={(): void => setHoveredAction((h) => (h === a.key ? null : h))}
          >
            <>{a.label()}</>
          </Button.Secondary>
        ))}
      </div>
      <div>{status}</div>
    </div>
  );
}

function TreeActionsDropdown({ treeName, treeDefinition }: { readonly treeName: string; readonly treeDefinition: any }): JSX.Element | null {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState<{ readonly top: number; readonly left: number } | null>(null);

  const hasAnyPermission = React.useMemo(() => {
    if (!(treeName in TREE_RESOURCES)) return false;
    return (
      hasPermission(TREE_RESOURCES[treeName as TreeNameKey], 'rebuild_full_names') ||
      hasPermission(TREE_RESOURCES[treeName as TreeNameKey], 'repair')
    );
  }, [treeName]);

  const updatePosition = React.useCallback(() => {
    const element = anchorRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    setPosition({ top: rect.bottom + window.scrollY + 4, left: rect.right + window.scrollX });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    updatePosition();
    const onClick = (e: MouseEvent): void => {
      if (
  anchorRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) {
        return; // Inside
      }
      setOpen(false);
    };
    const onScrollOrResize = (): void => updatePosition();
    window.addEventListener('mousedown', onClick, { capture: true });
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('mousedown', onClick, { capture: true } as any);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, updatePosition]);

  if (!hasAnyPermission) return null;

  return (
    <>
      <Button.Icon
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={headerText.treeOptions()}
        icon="cog"
        title={headerText.treeOptions()}
        onClick={(e): void => {
          e.preventDefault();
          if (open) {
            setOpen(false);
            return;
          }
          anchorRef.current = e.currentTarget as HTMLButtonElement;
          setOpen((o) => !o);
          setTimeout(updatePosition, 0);
        }}
      />
      {open && position && (
        <Portal>
          <div
            className="z-[10000] fixed w-64 -translate-x-full rounded border border-gray-300 dark:border-gray-600 shadow-lg"
            ref={menuRef}
            role="menu"
            style={{ top: position.top, left: position.left }}
          >
            <ActionsMenu treeDefinition={treeDefinition} treeName={treeName} />
          </div>
        </Portal>
      )}
    </>
  );
}

const handleClick = async (tree: string): Promise<void> =>
  ping(`/api/specify_tree/${tree.toLowerCase()}/repair/`, {
    method: 'POST',
    errorMode: 'dismissible',
  }).then(f.void);

export function TreeRepairOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  const loading = React.useContext(LoadingContext);

  const [tree, setTree] = useSearchParameter('tree');
  React.useEffect(
    () =>
      tree === undefined
        ? undefined
        : loading(handleClick(tree).then(handleClose)),
    [loading, handleClose, tree]
  );

  return (
    <TreeSelectDialog
      confirmationMessage={headerText.treeRepairComplete()}
      getLink={(tree): string =>
        formatUrl('/specify/task/repair-tree/', { tree: tree.toLowerCase() })
      }
      permissionName="repair"
      title={headerText.repairTree()}
      onClick={setTree}
      onClose={handleClose}
    />
  );
}

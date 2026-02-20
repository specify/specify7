/**
 * Tree actions dropdown and menu
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { treeText } from '../../localization/tree';
import { ajax } from '../../utils/ajax';
import { ping } from '../../utils/ajax/ping';
import { parseRebuildResponse } from '../../utils/treeRebuild';
import { type RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Portal } from '../Molecules/Portal';
import { hasPermission } from '../Permissions/helpers';

const TREE_RESOURCES = {
  Taxon: '/tree/edit/taxon',
  Geography: '/tree/edit/geography',
  Storage: '/tree/edit/storage',
  GeologicTimePeriod: '/tree/edit/geologictimeperiod',
  LithoStrat: '/tree/edit/lithostrat',
  TectonicUnit: '/tree/edit/tectonicunit',
} as const;

type TreeNameKey = keyof typeof TREE_RESOURCES;
type ActionKey = 'rebuildAccepted' | 'rebuildSynonyms' | 'repair';

type TreeActionsProps = {
  readonly treeName: string;
  readonly treeDefinition: any;
};

type ActionDef = {
  readonly key: ActionKey;
  readonly can: boolean;
  readonly label: () => LocalizedString;
  readonly description: () => LocalizedString;
  readonly run: () => void;
};

function ActionsMenu({ treeName, treeDefinition }: TreeActionsProps): JSX.Element | null {
  const [result, setResult] = React.useState<{
    readonly accepted: number;
    readonly synonyms: number;
    readonly total: number;
  } | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [repairStatus, setRepairStatus] = React.useState<'idle' | 'success'>('idle');
  const [hoveredAction, setHoveredAction] = React.useState<ActionKey | null>(null);

  if (typeof treeDefinition !== 'object') return null;
  if (!(treeName in TREE_RESOURCES)) return null;

  const canRebuild = hasPermission(
    TREE_RESOURCES[treeName as TreeNameKey],
    'rebuild_fullname'
  );
  const canRepair = hasPermission(
    TREE_RESOURCES[treeName as TreeNameKey],
    'repair'
  );

  if (!canRebuild && !canRepair) return null;

  const id = treeDefinition.get('id');

  const trigger = (withSynonyms: boolean): void => {
    setIsRunning(true);
    setResult(null);
    setRepairStatus('idle');
    ajax<unknown>(
      `/trees/specify_tree/${treeName.toLowerCase()}/${id}/rebuild_fullname/${withSynonyms ? '?rebuild_synonyms=true' : ''}`,
      {
        method: 'POST',
        headers: { Accept: 'application/json' },
        errorMode: 'dismissible',
      }
    )
      .then((resp) => setResult(parseRebuildResponse(resp)))
      .finally(() => setIsRunning(false));
  };

  const triggerRepair = (): void => {
    if (!canRepair) return;
    setIsRunning(true);
    setResult(null);
    setRepairStatus('idle');
    ping(`/trees/specify_tree/${treeName.toLowerCase()}/repair/`, {
      method: 'POST',
      errorMode: 'dismissible',
    })
      .then(() => setRepairStatus('success'))
      .finally(() => setIsRunning(false));
  };

  const actions: RA<ActionDef> = [
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

  const visibleActions = actions.filter((action) => action.can);

  const status: React.ReactNode = isRunning ? (
    <span className="text-xs">{commonText.working()}</span>
  ) : result && canRebuild ? (
    result.total > 0 ? (
      <div className="text-xs">
        {treeText.rebuildResult({
          total: result.total,
          accepted: result.accepted,
          synonyms: result.synonyms,
        })}
      </div>
    ) : (
      <div className="text-xs italic">{treeText.noFullNamesUpdated()}</div>
    )
  ) : repairStatus === 'success' && (!canRebuild || !result) ? (
    <div className="text-xs text-green-600 dark:text-green-400">
      {headerText.treeRepairComplete()}
    </div>
  ) : hoveredAction ? (
    (() => {
      const current = actions.find((action) => action.key === hoveredAction);
      return current ? (
        <div className="text-xs leading-snug opacity-80">{current.description()}</div>
      ) : null;
    })()
  ) : null;

  return (
    <div className="flex flex-col gap-1 p-2 bg-[color:var(--background)] rounded">
      <div className="flex flex-col gap-2">
        {visibleActions.map((action) => (
          <Button.Secondary
            disabled={isRunning}
            key={action.key}
            onClick={(event): void => {
              event.preventDefault();
              action.run();
            }}
            onMouseEnter={(): void => setHoveredAction(action.key)}
            onMouseLeave={(): void =>
              setHoveredAction((previousHovered) =>
                previousHovered === action.key ? null : previousHovered
              )
            }
          >
            <>{action.label()}</>
          </Button.Secondary>
        ))}
      </div>
      <div>{status}</div>
    </div>
  );
}

export function TreeActionsDropdown({ treeName, treeDefinition }: TreeActionsProps): JSX.Element | null {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState<{ readonly top: number; readonly left: number } | null>(null);

  const hasAnyPermission = React.useMemo(() => {
    if (!(treeName in TREE_RESOURCES)) return false;
    return (
      hasPermission(TREE_RESOURCES[treeName as TreeNameKey], 'rebuild_fullname') ||
      hasPermission(TREE_RESOURCES[treeName as TreeNameKey], 'repair')
    );
  }, [treeName]);

  const updatePosition = React.useCallback(() => {
    const element = anchorRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX,
    });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    updatePosition();

    const onClick = (event: MouseEvent): void => {
      if (
        anchorRef.current?.contains(event.target as Node) ||
        menuRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };

    const onScrollOrResize = (): void => updatePosition();

    window.addEventListener('mousedown', onClick, { capture: true });
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      window.removeEventListener('mousedown', onClick, { capture: true });
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
        onClick={(event): void => {
          event.preventDefault();
          if (open) {
            setOpen(false);
            return;
          }
          anchorRef.current = event.currentTarget as HTMLButtonElement;
          setOpen((current) => !current);
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

import React, { useMemo } from 'react';
import { TooltipAnchor } from '@librechat/client';
import type { ModelSelectorProps } from '~/common';
import {
  renderModelSpecs,
  renderEndpoints,
  renderSearchResults,
  renderCustomGroups,
} from './components';
import { ModelSelectorProvider, useModelSelectorContext } from './ModelSelectorContext';
import { useShortcutAriaKey, useShortcutHint } from '~/hooks/useKeyboardShortcuts';
import { ModelSelectorChatProvider } from './ModelSelectorChatContext';
import { getSelectedIcon, getDisplayValue } from './utils';
import { activateCatalog } from '~/hooks/useCatalogWarmup';
import { CustomMenu as Menu } from './CustomMenu';
import { isModelSelectorShown } from './shown';
import DialogManager from './DialogManager';
import { useLocalize } from '~/hooks';

function activateSelectorCatalogs(open: boolean) {
  if (!open) return;
  activateCatalog('models');
  activateCatalog('agents');
  activateCatalog('assistants');
}

/** onedux patch: `composer` is the compact, borderless trigger used under the composer
 *  (ComposerModelRow); `header` is the stock look. */
export function ModelSelectorContent({ variant = 'header' }: { variant?: 'header' | 'composer' }) {
  const localize = useLocalize();
  const modelSelectorHint = useShortcutHint('openModelSelector', localize('com_ui_select_model'));
  const modelSelectorAriaKey = useShortcutAriaKey('openModelSelector');

  const {
    // LibreChat
    agentsMap,
    modelSpecs,
    mappedEndpoints,
    endpointsConfig,
    // State
    searchValue,
    searchResults,
    selectedValues,
    // Functions
    setSearchValue,
    setSelectedValues,
    // Dialog
    keyDialogOpen,
    onOpenChange,
    keyDialogEndpoint,
  } = useModelSelectorContext();

  const selectedIcon = useMemo(
    () =>
      getSelectedIcon({
        mappedEndpoints: mappedEndpoints ?? [],
        selectedValues,
        modelSpecs,
        endpointsConfig,
        agentsMap,
      }),
    [mappedEndpoints, selectedValues, modelSpecs, endpointsConfig, agentsMap],
  );
  const selectedDisplayValue = useMemo(
    () =>
      getDisplayValue({
        localize,
        agentsMap,
        modelSpecs,
        selectedValues,
        mappedEndpoints,
      }),
    [localize, agentsMap, modelSpecs, selectedValues, mappedEndpoints],
  );

  const trigger = (
    <TooltipAnchor
      aria-label={localize('com_ui_select_model')}
      description={modelSelectorHint}
      render={
        <button
          data-testid="model-selector-button"
          aria-keyshortcuts={modelSelectorAriaKey}
          className={
            variant === 'composer'
              ? 'text-text-secondary hover:text-text-primary hover:bg-surface-hover flex h-8 max-w-full items-center gap-1.5 rounded-lg px-2 text-sm'
              : 'border-border-light bg-presentation text-text-primary hover:bg-surface-active-alt rounded-theme-control flex h-9 max-w-full items-center gap-2 border px-3 py-2 text-sm'
          }
          aria-label={localize('com_ui_select_model')}
        >
          {selectedIcon && React.isValidElement(selectedIcon) && (
            <div className="flex shrink-0 items-center justify-center overflow-hidden">
              {selectedIcon}
            </div>
          )}
          <span className="truncate text-start">{selectedDisplayValue}</span>
        </button>
      }
    />
  );

  return (
    <div
      className={
        variant === 'composer'
          ? 'relative flex max-w-[60vw] min-w-0 items-center sm:max-w-xs'
          : 'relative flex max-w-[60vw] min-w-0 flex-col items-center gap-2 sm:max-w-xs'
      }
    >
      <Menu
        onOpenChange={activateSelectorCatalogs}
        values={selectedValues}
        onValuesChange={(values: Record<string, any>) => {
          setSelectedValues({
            endpoint: values.endpoint || '',
            model: values.model || '',
            modelSpec: values.modelSpec || '',
          });
        }}
        onSearch={(value) => setSearchValue(value)}
        combobox={<input id="model-search" placeholder=" " />}
        comboboxLabel={localize('com_endpoint_search_models')}
        trigger={trigger}
      >
        {searchResults ? (
          renderSearchResults(searchResults, localize, searchValue)
        ) : (
          <>
            {/* Render ungrouped modelSpecs (no group field) */}
            {renderModelSpecs(
              modelSpecs?.filter((spec) => !spec.group) || [],
              selectedValues.modelSpec || '',
            )}
            {/* Render endpoints (will include grouped specs matching endpoint names) */}
            {renderEndpoints(mappedEndpoints ?? [])}
            {/* Render custom groups (specs with group field not matching any endpoint) */}
            {renderCustomGroups(modelSpecs || [], mappedEndpoints ?? [])}
          </>
        )}
      </Menu>
      <DialogManager
        keyDialogOpen={keyDialogOpen}
        onOpenChange={onOpenChange}
        endpointsConfig={endpointsConfig || {}}
        keyDialogEndpoint={keyDialogEndpoint || undefined}
      />
    </div>
  );
}

export default function ModelSelector({ startupConfig }: ModelSelectorProps) {
  if (!isModelSelectorShown(startupConfig)) {
    return null;
  }

  return (
    <ModelSelectorChatProvider>
      <ModelSelectorProvider startupConfig={startupConfig}>
        <ModelSelectorContent />
      </ModelSelectorProvider>
    </ModelSelectorChatProvider>
  );
}

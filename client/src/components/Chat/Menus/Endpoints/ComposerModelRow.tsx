import React, { useCallback, useEffect, useMemo } from 'react';
import type { TStartupConfig } from 'librechat-data-provider';
import { ModelSelectorProvider, useModelSelectorContext } from './ModelSelectorContext';
import { ModelSelectorChatProvider } from './ModelSelectorChatContext';
import { ModelSelectorContent } from './ModelSelector';
import { isModelSelectorShown } from './shown';

/**
 * onedux patch: the model picker lives under the composer instead of the header, with an
 * Auto / Manual switch beside it.
 *
 * - Auto   = the model spec marked `default: true` in librechat.yaml (for onedux: the LiteLLM
 *            auto router). The chip still shows the model Manual would use, greyed as a preview.
 * - Manual = any concrete model. The chip shows it.
 *
 * The Manual model is the last one picked by hand (remembered in localStorage), else the first
 * model of the auto spec's endpoint. Clicking the switch in Auto selects it; in Manual it selects
 * the auto spec again. Picking a model from the chip's menu goes Manual, picking the auto spec
 * goes Auto.
 * Without a default spec there is no switch, just the picker.
 *
 * Copy is English only: the site ships English only.
 */
const LAST_MANUAL_KEY = 'onedux:lastManualModel';

type LastManual = { endpoint: string; model: string };

function readLastManual(): LastManual | null {
  try {
    const value = JSON.parse(localStorage.getItem(LAST_MANUAL_KEY) ?? 'null');
    if (value != null && typeof value.endpoint === 'string' && typeof value.model === 'string') {
      return value as LastManual;
    }
  } catch {
    /* storage unavailable or corrupt: fall back to the first model */
  }
  return null;
}

function ComposerModelRowContent() {
  const { modelSpecs, mappedEndpoints, selectedValues, handleSelectSpec, handleSelectModel } =
    useModelSelectorContext();

  const autoSpec = useMemo(
    () => (modelSpecs ?? []).find((spec) => spec.default === true) ?? null,
    [modelSpecs],
  );
  const isAuto = autoSpec != null && selectedValues.modelSpec === autoSpec.name;

  useEffect(() => {
    const { endpoint, model, modelSpec } = selectedValues;
    if (!modelSpec && endpoint && model) {
      try {
        localStorage.setItem(LAST_MANUAL_KEY, JSON.stringify({ endpoint, model }));
      } catch {
        /* storage unavailable: nothing to remember */
      }
    }
  }, [selectedValues]);

  /** The model Manual would use; recomputed when the selection changes so a fresh hand pick
   *  (already written to storage by the effect above) is what Auto previews next. */
  const manualTarget = useMemo(() => {
    if (autoSpec == null) {
      return null;
    }
    const endpoints = mappedEndpoints ?? [];
    const last = readLastManual();
    const endpoint =
      endpoints.find((item) => item.value === last?.endpoint) ??
      endpoints.find((item) => item.value === (autoSpec.preset.endpoint ?? ''));
    if (endpoint == null) {
      return null;
    }
    /* The auto router is itself a model on the endpoint; Manual means something else. */
    const names = (endpoint.models ?? [])
      .map((item) => item.name)
      .filter((name) => name !== autoSpec.preset.model);
    const model =
      last != null && last.endpoint === endpoint.value && names.includes(last.model)
        ? last.model
        : names[0];
    return model ? { endpoint, model } : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpec, mappedEndpoints, selectedValues]);

  const toggle = useCallback(() => {
    if (autoSpec == null) {
      return;
    }
    if (!isAuto) {
      handleSelectSpec(autoSpec);
      return;
    }
    if (manualTarget != null) {
      handleSelectModel(manualTarget.endpoint, manualTarget.model);
    }
  }, [autoSpec, isAuto, manualTarget, handleSelectSpec, handleSelectModel]);

  const preview =
    isAuto && manualTarget != null
      ? { endpoint: manualTarget.endpoint.value, model: manualTarget.model }
      : null;

  return (
    <div
      data-testid="composer-model-row"
      className="flex min-w-0 items-center justify-end gap-1 px-2 pt-1.5"
    >
      <div className={isAuto ? 'min-w-0 opacity-60 hover:opacity-100' : 'min-w-0'}>
        <ModelSelectorContent variant="composer" preview={preview} />
      </div>
      {autoSpec != null && (
        <button
          type="button"
          data-testid="composer-model-mode"
          onClick={toggle}
          aria-pressed={isAuto}
          aria-label={isAuto ? 'Auto model selection. Switch to manual' : 'Manual model selection. Switch to auto'}
          title={isAuto ? 'Picks the best model for each message. Click to choose a model.' : 'Click to let onedux pick the model.'}
          className="text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg px-2 py-1 text-sm font-medium"
        >
          {isAuto ? 'Auto' : 'Manual'}
        </button>
      )}
    </div>
  );
}

export default function ComposerModelRow({
  startupConfig,
}: {
  startupConfig: TStartupConfig | undefined;
}) {
  if (!isModelSelectorShown(startupConfig)) {
    return null;
  }
  return (
    <ModelSelectorChatProvider>
      <ModelSelectorProvider startupConfig={startupConfig}>
        <ComposerModelRowContent />
      </ModelSelectorProvider>
    </ModelSelectorChatProvider>
  );
}

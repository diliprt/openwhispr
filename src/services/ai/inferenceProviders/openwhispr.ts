import type { InferenceProvider } from "./types";
import { getSettings } from "../../../stores/settingsStore";
import logger from "../../../utils/logger";

export const openwhisprProvider: InferenceProvider = {
  id: "openwhispr",
  async call({ text, model, agentName, config, ctx }) {
    logger.logReasoning("OPENWHISPR_START", { model, agentName });

    const customPrompt = config.systemPrompt
      ? undefined
      : getSettings().customPrompts.cleanup || undefined;

    const res = await window.electronAPI?.cloudReason?.(text, {
      agentName,
      customDictionary: ctx.getCustomDictionary(),
      customPrompt,
      systemPrompt: config.systemPrompt,
      language: ctx.getPreferredLanguage(),
      locale: ctx.getUiLanguage(),
    });

    if (!res?.success) {
      const err: Error & { code?: string } = new Error(
        res?.error || "OpenWhispr cloud reasoning failed"
      );
      err.code = res?.code;
      throw err;
    }

    logger.logReasoning("OPENWHISPR_SUCCESS", {
      model: res.model,
      provider: res.provider,
      resultLength: res.text.length,
      promptMode: res.promptMode,
      matchType: res.matchType,
    });

    return res.text;
  },
};

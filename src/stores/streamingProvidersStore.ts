import { create } from "zustand";

export interface NoteRecordingProviderModel {
  id: string;
  name: string;
  default?: boolean;
}

export interface NoteRecordingProvider {
  id: string;
  name: string;
  models: NoteRecordingProviderModel[];
}

interface StreamingProvidersState {
  providers: NoteRecordingProvider[] | null;
}

export const useStreamingProvidersStore = create<StreamingProvidersState>()(() => ({
  providers: null,
}));

let inFlight: Promise<NoteRecordingProvider[] | null> | null = null;

export async function fetchProviders(): Promise<NoteRecordingProvider[] | null> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    useStreamingProvidersStore.setState({ providers: [] });
    inFlight = null;
    return [];
  })();

  return inFlight;
}

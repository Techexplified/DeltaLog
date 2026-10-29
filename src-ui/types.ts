export type TabId = 'compare' | 'home' | 'archive';

export type ScreenView = 'home' | 'save-version' | 'save-success';

export type SelectionStatus = 'EMPTY' | 'MULTIPLE' | 'NOT_FRAME' | 'CHILD_SELECTED' | 'LOADED';

export type VersionBump = 'major' | 'minor' | 'patch';

export type CompareMode = 'version-vs-version' | 'version-vs-current';

export interface VersionIndexItem {
  version: string;
  label: 'major' | 'minor' | 'patch' | 'base';
  note: string;
  author: string;
  createdAt: string;
  cloneNodeId?: string;
  layerCount: number;
  sizeKb: number;
}

export interface TrackedFrameItem {
  id: string;
  name: string;
  versionsCount: number;
  latestVersion: string;
}

export interface SelectionData {
  status: SelectionStatus;
  id?: string;
  name?: string;
  w?: number;
  h?: number;
  layerCount?: number;
  hasSavedVersion?: boolean;
  latestVersion?: string | null;
  versionsCount?: number;
  versions?: VersionIndexItem[];
  thumbnail?: string | null;
  trackedFrames?: TrackedFrameItem[];
  selectedNodeName?: string;
  parentFrameId?: string;
  parentFrameName?: string;
  message?: string;
}

export interface SaveVersionPayload {
  frameId: string;
  version: string;
  label: VersionBump | 'base';
  note: string;
  keepFullCopy: boolean;
  compareAfter: boolean;
}

export interface SaveSuccessData {
  version: string;
  author: string;
  sizeKb: number;
  compareAfter: boolean;
  versionsCount: number;
}

export interface CompareFilterOptions {
  text: boolean;
  colour: boolean;
  layout: boolean;
  effects: boolean;
  visibility: boolean;
  layerNames: boolean;
}

export type PluginMessage = 
  | { type: 'selection-update'; [key: string]: any }
  | { type: 'thumbnail-update'; id: string; thumbnail: string | null }
  | { type: 'SAVE_VERSION_SUCCESS'; [key: string]: any }
  | { type: 'SAVE_VERSION_ERROR'; error: string }
  | { type: string; [key: string]: any };

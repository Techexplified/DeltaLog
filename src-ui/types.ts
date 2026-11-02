export type TabId = 'compare' | 'home' | 'history';

export type ScreenView = 'home' | 'save-version' | 'save-success' | 'compare-results' | 'change-detail' | 'changelog' | 'settings';

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
  userName?: string;
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

export interface DiffPropertyChange {
  group: 'text' | 'colour' | 'layout' | 'effects' | 'visibility' | 'layerNames';
  prop: string;
  before: any;
  after: any;
  description: string;
}

export interface SnapshotNode {
  id: string;
  type: string;
  name: string;
  parentId: string | null;
  text: { characters: string; fontSize: number | string; fontFamily: string } | null;
  colour: { fills: string[]; strokes: string[] };
  layout: { x: number; y: number; w: number; h: number };
  effects: { opacity: number; cornerRadius: number | string; shadows: string[] };
  visibility: { visible: boolean };
}

export interface DiffItem {
  id: string;
  name: string;
  type: string;
  path: string;
  status: 'changed' | 'added' | 'removed';
  changes: DiffPropertyChange[];
  layout: { x: number; y: number; w: number; h: number };
  beforeNode?: SnapshotNode | null;
  afterNode?: SnapshotNode | null;
}

export interface DiffResult {
  frameId: string;
  frameName: string;
  fromVersion: string;
  toVersion: string;
  fromThumbnail: string | null;
  toThumbnail: string | null;
  summary: {
    changed: number;
    added: number;
    removed: number;
    total: number;
  };
  items: DiffItem[];
  appliedFilters: CompareFilterOptions;
}

export interface CompareRequestPayload {
  frameId: string;
  mode: CompareMode;
  fromVersion: string;
  toVersion: string;
  filters: CompareFilterOptions;
}

export interface ImportBackupPayload {
  frameName: string;
  versions: VersionIndexItem[];
  latestSvg: string;
  latestVersion: string;
  milestoneSvgs: Record<string, string>;
  snapshots: Record<string, any>;
}

export interface ImportedFrameItem {
  frameName: string;
  versions: VersionIndexItem[];
  snapshots: Record<string, any>;
  latestVersion: string;
  latestSvg: string;
  milestoneSvgs: Record<string, string>;
  latestPngBase64?: string | null;
}

export interface ParsedImportData {
  scope: 'frame' | 'document-file';
  frames: ImportedFrameItem[];
  totalIncomingVersions: number;
  frameName: string;
  versions: VersionIndexItem[];
  snapshots: Record<string, any>;
  latestVersion: string;
  latestSvg: string;
  milestoneSvgs: Record<string, string>;
  latestPngBase64?: string | null;
  incomingCount: number;
}

export type PluginMessage = 
  | { type: 'selection-update'; [key: string]: any }
  | { type: 'thumbnail-update'; id: string; thumbnail: string | null }
  | { type: 'SAVE_VERSION_SUCCESS'; [key: string]: any }
  | { type: 'SAVE_VERSION_ERROR'; error: string }
  | { type: string; [key: string]: any };

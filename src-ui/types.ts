export type TabId = 'compare' | 'home' | 'archive';

export type SelectionStatus = 'EMPTY' | 'MULTIPLE' | 'NOT_FRAME' | 'CHILD_SELECTED' | 'LOADED';

export interface SelectionData {
  status: SelectionStatus;
  id?: string;
  name?: string;
  w?: number;
  h?: number;
  layerCount?: number;
  hasSavedVersion?: boolean;
  selectedNodeName?: string;
  parentFrameId?: string;
  parentFrameName?: string;
  message?: string;
}

export type PluginMessage = 
  | { type: 'selection-update'; [key: string]: any }
  | { type: string; [key: string]: any };

figma.showUI(__html__, { width: 360, height: 600, themeColors: true });

// Plugin Data storage keys
const DELTALOG_INDEX_KEY = "deltalog_index";
const DELTALOG_GLOBAL_KEY = "deltalog_global_versions";
const SNAPSHOTS_PAGE_NAME = "DeltaLog snapshots, do not edit";
const GLOBAL_VERSION_LIMIT = 10;

// Types
interface SnapshotNode {
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

interface VersionSnapshot {
  frameId: string;
  version: string;
  label: 'major' | 'minor' | 'patch' | 'base';
  note: string;
  author: string;
  createdAt: string;
  cloneNodeId?: string;
  nodes: Record<string, SnapshotNode>;
}

interface VersionIndexItem {
  version: string;
  label: 'major' | 'minor' | 'patch' | 'base';
  note: string;
  author: string;
  createdAt: string;
  cloneNodeId?: string;
  layerCount: number;
  sizeKb: number;
}

interface GlobalVersionEntry {
  frameId: string;
  version: string;
  createdAt: string;
  cloneNodeId?: string;
}

interface CompareFilterOptions {
  text: boolean;
  colour: boolean;
  layout: boolean;
  effects: boolean;
  visibility: boolean;
  layerNames: boolean;
}

interface DiffPropertyChange {
  group: 'text' | 'colour' | 'layout' | 'effects' | 'visibility' | 'layerNames';
  prop: string;
  before: any;
  after: any;
  description: string;
}

interface DiffItem {
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

interface DiffResult {
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

// Helpers
function hasHistory(node: SceneNode): boolean {
  try {
    const raw = node.getPluginData(DELTALOG_INDEX_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

function getFrameVersions(node: SceneNode): VersionIndexItem[] {
  try {
    const raw = node.getPluginData(DELTALOG_INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as VersionIndexItem[];
  } catch {
    return [];
  }
}

function findTopLevelFrame(node: SceneNode): FrameNode | ComponentNode | SectionNode | null {
  let current: BaseNode | null = node;
  while (current && current.parent && current.parent.type !== "PAGE") {
    current = current.parent;
  }
  if (current && (current.type === "FRAME" || current.type === "COMPONENT" || current.type === "SECTION")) {
    return current as FrameNode | ComponentNode | SectionNode;
  }
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function extractPaints(paints: ReadonlyArray<Paint> | PluginAPI['mixed']): string[] {
  if (!paints || paints === figma.mixed || !Array.isArray(paints)) return [];
  const results: string[] = [];
  for (const paint of paints) {
    if (paint.visible !== false && paint.type === 'SOLID' && paint.color) {
      results.push(rgbToHex(paint.color.r, paint.color.g, paint.color.b));
    }
  }
  return results;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;
    const c1 = b1 >> 2;
    const c2 = ((b1 & 3) << 4) | (b2 >> 4);
    const c3 = ((b2 & 15) << 2) | (b3 >> 6);
    const c4 = b3 & 63;
    base64 += chars[c1] + chars[c2];
    base64 += i + 1 < len ? chars[c3] : '=';
    base64 += i + 2 < len ? chars[c4] : '=';
  }
  return base64;
}

async function getFrameThumbnail(node: SceneNode): Promise<string | null> {
  try {
    const bytes = await node.exportAsync({
      format: 'PNG',
      constraint: { type: 'SCALE', value: 0.25 }
    });
    return `data:image/png;base64,${uint8ArrayToBase64(bytes)}`;
  } catch (err) {
    console.warn("DeltaLog: thumbnail export skipped:", err);
    return null;
  }
}

// Layer Serializer
function serializeFrame(frame: FrameNode | ComponentNode | SectionNode): Record<string, SnapshotNode> {
  const nodesMap: Record<string, SnapshotNode> = {};
  const frameX = frame.absoluteTransform[0][2];
  const frameY = frame.absoluteTransform[1][2];

  // Include the root frame itself
  nodesMap[frame.id] = {
    id: frame.id,
    type: frame.type,
    name: frame.name,
    parentId: null,
    text: null,
    colour: {
      fills: 'fills' in frame ? extractPaints(frame.fills) : [],
      strokes: 'strokes' in frame ? extractPaints(frame.strokes) : []
    },
    layout: {
      x: 0,
      y: 0,
      w: Math.round(frame.width * 100) / 100,
      h: Math.round(frame.height * 100) / 100
    },
    effects: {
      opacity: 'opacity' in frame ? (frame.opacity ?? 1) : 1,
      cornerRadius: 'cornerRadius' in frame && frame.cornerRadius !== figma.mixed ? (frame.cornerRadius as number) : 0,
      shadows: []
    },
    visibility: { visible: frame.visible }
  };

  // Traverse all descendants
  const descendants = frame.findAll();
  for (const node of descendants) {
    const nodeX = node.absoluteTransform[0][2];
    const nodeY = node.absoluteTransform[1][2];

    let textData: SnapshotNode['text'] = null;
    if (node.type === 'TEXT') {
      const tNode = node as TextNode;
      textData = {
        characters: tNode.characters || '',
        fontSize: tNode.fontSize === figma.mixed ? 'mixed' : (tNode.fontSize as number),
        fontFamily: tNode.fontName === figma.mixed ? 'mixed' : (tNode.fontName as FontName).family
      };
    }

    let cornerRadius: number | string = 0;
    if ('cornerRadius' in node) {
      cornerRadius = node.cornerRadius === figma.mixed ? 'mixed' : (node.cornerRadius as number);
    }

    nodesMap[node.id] = {
      id: node.id,
      type: node.type,
      name: node.name,
      parentId: node.parent ? node.parent.id : null,
      text: textData,
      colour: {
        fills: 'fills' in node ? extractPaints(node.fills) : [],
        strokes: 'strokes' in node ? extractPaints(node.strokes) : []
      },
      layout: {
        x: Math.round((nodeX - frameX) * 100) / 100,
        y: Math.round((nodeY - frameY) * 100) / 100,
        w: Math.round(node.width * 100) / 100,
        h: Math.round(node.height * 100) / 100
      },
      effects: {
        opacity: 'opacity' in node ? (node.opacity ?? 1) : 1,
        cornerRadius: cornerRadius,
        shadows: []
      },
      visibility: { visible: node.visible }
    };
  }

  return nodesMap;
}

// Milestone Cloner
async function cloneFrameMilestone(frame: FrameNode | ComponentNode | SectionNode, version: string): Promise<string | null> {
  let clone: (FrameNode | ComponentNode | SectionNode) | null = null;
  try {
    const pages = figma.root.children;
    let snapshotsPage = pages.find(p => p.name === SNAPSHOTS_PAGE_NAME);
    if (!snapshotsPage) {
      snapshotsPage = figma.createPage();
      snapshotsPage.name = SNAPSHOTS_PAGE_NAME;
    }

    // Dynamic-page mode requirement: target page must be loaded before accessing children or appendChild
    await snapshotsPage.loadAsync();

    clone = frame.clone();
    clone.name = `${frame.name} (${version})`;
    snapshotsPage.appendChild(clone);

    // Position clones neatly horizontally on snapshots page
    const existingCount = snapshotsPage.children.length;
    clone.x = (existingCount - 1) * (frame.width + 120);
    clone.y = 0;

    return clone.id;
  } catch (err) {
    console.warn("DeltaLog: Milestone clone failed:", err);
    // Cleanup orphaned clone from current page if reparenting failed
    if (clone && !clone.removed) {
      try {
        clone.remove();
      } catch {}
    }
    return null;
  }
}

// Global 10 Limit FIFO Pruner
async function enforceGlobalLimit() {
  try {
    const raw = figma.root.getPluginData(DELTALOG_GLOBAL_KEY);
    if (!raw) return;
    let globalList: GlobalVersionEntry[] = JSON.parse(raw);

    while (globalList.length > GLOBAL_VERSION_LIMIT) {
      const oldest = globalList.shift();
      if (!oldest) break;

      // 1. Delete milestone clone if exists
      if (oldest.cloneNodeId) {
        try {
          const cloneNode = await figma.getNodeByIdAsync(oldest.cloneNodeId);
          if (cloneNode) cloneNode.remove();
        } catch {}
      }

      // 2. Remove version entry from frame
      try {
        const frameNode = await figma.getNodeByIdAsync(oldest.frameId) as SceneNode | null;
        if (frameNode) {
          frameNode.setPluginData(`deltalog_ver_${oldest.version}`, "");
          const fIndexRaw = frameNode.getPluginData(DELTALOG_INDEX_KEY);
          if (fIndexRaw) {
            const fIndex: VersionIndexItem[] = JSON.parse(fIndexRaw);
            const filtered = fIndex.filter(item => item.version !== oldest.version);
            frameNode.setPluginData(DELTALOG_INDEX_KEY, JSON.stringify(filtered));
          }
        }
      } catch {}
    }

    figma.root.setPluginData(DELTALOG_GLOBAL_KEY, JSON.stringify(globalList));
  } catch (err) {
    console.warn("DeltaLog: Global limit enforcement error:", err);
  }
}

// List all tracked frames across the document
async function getTrackedFramesList(): Promise<{ id: string; name: string; versionsCount: number; latestVersion: string }[]> {
  try {
    const raw = figma.root.getPluginData(DELTALOG_GLOBAL_KEY);
    if (!raw) return [];
    const globalEntries: GlobalVersionEntry[] = JSON.parse(raw);
    
    // Group by frameId
    const map = new Map<string, { versionsCount: number; latestVersion: string }>();
    for (const entry of globalEntries) {
      const existing = map.get(entry.frameId);
      if (!existing) {
        map.set(entry.frameId, { versionsCount: 1, latestVersion: entry.version });
      } else {
        existing.versionsCount += 1;
        existing.latestVersion = entry.version;
      }
    }

    const results = [];
    for (const [frameId, data] of map.entries()) {
      try {
        const node = await figma.getNodeByIdAsync(frameId);
        if (node && !node.removed) {
          results.push({
            id: frameId,
            name: node.name,
            versionsCount: data.versionsCount,
            latestVersion: data.latestVersion
          });
        }
      } catch {}
    }
    return results;
  } catch {
    return [];
  }
}

// Selection updater
// Layer path builder (e.g. "Login Screen / Form / Button / Primary")
function getLayerPath(nodes: Record<string, SnapshotNode>, startNode: SnapshotNode): string {
  const parts: string[] = [startNode.name];
  let current: SnapshotNode | undefined = startNode;
  const visited = new Set<string>();

  while (current && current.parentId && !visited.has(current.parentId)) {
    visited.add(current.parentId);
    current = nodes[current.parentId];
    if (current && current.name) {
      parts.unshift(current.name);
    }
  }

  return parts.join(' / ');
}

// Diff Engine
function diffSnapshots(
  snapshotFrom: VersionSnapshot,
  snapshotTo: VersionSnapshot,
  filters: CompareFilterOptions
): { summary: { changed: number; added: number; removed: number; total: number }; items: DiffItem[] } {
  const items: DiffItem[] = [];
  const fromNodes = snapshotFrom.nodes || {};
  const toNodes = snapshotTo.nodes || {};

  const allToIds = new Set(Object.keys(toNodes));
  const allFromIds = new Set(Object.keys(fromNodes));

  // 1. Process layers in snapshotTo (Changed and Added)
  for (const id of allToIds) {
    const toNode = toNodes[id];
    const fromNode = fromNodes[id];

    if (!fromNode) {
      // Added layer (in newer snapshot but not older)
      if (id === snapshotTo.frameId) continue;
      items.push({
        id: toNode.id,
        name: toNode.name,
        type: toNode.type,
        path: getLayerPath(toNodes, toNode),
        status: 'added',
        changes: [{
          group: 'layout',
          prop: 'layer',
          before: null,
          after: toNode.name,
          description: `New ${toNode.type.toLowerCase()} layer`
        }],
        layout: toNode.layout,
        beforeNode: null,
        afterNode: toNode
      });
    } else {
      // Layer exists in both: compare properties strictly based on ACTIVE FILTERS ONLY
      const changes: DiffPropertyChange[] = [];

      // A. Text filter
      if (filters.text && toNode.text && fromNode.text) {
        if (toNode.text.characters !== fromNode.text.characters) {
          changes.push({
            group: 'text',
            prop: 'characters',
            before: fromNode.text.characters,
            after: toNode.text.characters,
            description: `Text "${fromNode.text.characters}" → "${toNode.text.characters}"`
          });
        }
        if (toNode.text.fontSize !== fromNode.text.fontSize) {
          changes.push({
            group: 'text',
            prop: 'fontSize',
            before: fromNode.text.fontSize,
            after: toNode.text.fontSize,
            description: `Font size ${fromNode.text.fontSize}px → ${toNode.text.fontSize}px`
          });
        }
        if (toNode.text.fontFamily !== fromNode.text.fontFamily) {
          changes.push({
            group: 'text',
            prop: 'fontFamily',
            before: fromNode.text.fontFamily,
            after: toNode.text.fontFamily,
            description: `Font family ${fromNode.text.fontFamily} → ${toNode.text.fontFamily}`
          });
        }
      }

      // B. Colour filter (fills & strokes)
      if (filters.colour) {
        const fromFills = (fromNode.colour?.fills || []).join(', ');
        const toFills = (toNode.colour?.fills || []).join(', ');
        if (fromFills !== toFills) {
          changes.push({
            group: 'colour',
            prop: 'fills',
            before: fromFills || 'none',
            after: toFills || 'none',
            description: `Fill ${fromFills || 'none'} → ${toFills || 'none'}`
          });
        }

        const fromStrokes = (fromNode.colour?.strokes || []).join(', ');
        const toStrokes = (toNode.colour?.strokes || []).join(', ');
        if (fromStrokes !== toStrokes) {
          changes.push({
            group: 'colour',
            prop: 'strokes',
            before: fromStrokes || 'none',
            after: toStrokes || 'none',
            description: `Stroke ${fromStrokes || 'none'} → ${toStrokes || 'none'}`
          });
        }
      }

      // C. Layout filter (x, y, w, h with 2px sensitivity threshold)
      if (filters.layout && toNode.layout && fromNode.layout) {
        const dx = Math.abs(toNode.layout.x - fromNode.layout.x);
        const dy = Math.abs(toNode.layout.y - fromNode.layout.y);
        const dw = Math.abs(toNode.layout.w - fromNode.layout.w);
        const dh = Math.abs(toNode.layout.h - fromNode.layout.h);

        if (dw > 2 || dh > 2) {
          changes.push({
            group: 'layout',
            prop: 'size',
            before: `${fromNode.layout.w}×${fromNode.layout.h}`,
            after: `${toNode.layout.w}×${toNode.layout.w}`,
            description: `Size ${fromNode.layout.w}×${fromNode.layout.h} → ${toNode.layout.w}×${toNode.layout.h}`
          });
        }
        if (dx > 2 || dy > 2) {
          changes.push({
            group: 'layout',
            prop: 'position',
            before: `(${fromNode.layout.x}, ${fromNode.layout.y})`,
            after: `(${toNode.layout.x}, ${toNode.layout.y})`,
            description: `Position (${fromNode.layout.x}, ${fromNode.layout.y}) → (${toNode.layout.x}, ${toNode.layout.y})`
          });
        }
      }

      // D. Effects filter (opacity, cornerRadius)
      if (filters.effects && toNode.effects && fromNode.effects) {
        if (Math.abs((toNode.effects.opacity ?? 1) - (fromNode.effects.opacity ?? 1)) > 0.02) {
          const fromPct = Math.round((fromNode.effects.opacity ?? 1) * 100);
          const toPct = Math.round((toNode.effects.opacity ?? 1) * 100);
          changes.push({
            group: 'effects',
            prop: 'opacity',
            before: `${fromPct}%`,
            after: `${toPct}%`,
            description: `Opacity ${fromPct}% → ${toPct}%`
          });
        }
        if (toNode.effects.cornerRadius !== fromNode.effects.cornerRadius) {
          changes.push({
            group: 'effects',
            prop: 'cornerRadius',
            before: fromNode.effects.cornerRadius,
            after: toNode.effects.cornerRadius,
            description: `Corner radius ${fromNode.effects.cornerRadius} → ${toNode.effects.cornerRadius}`
          });
        }
      }

      // E. Visibility filter
      if (filters.visibility && toNode.visibility && fromNode.visibility) {
        if (toNode.visibility.visible !== fromNode.visibility.visible) {
          changes.push({
            group: 'visibility',
            prop: 'visible',
            before: fromNode.visibility.visible,
            after: toNode.visibility.visible,
            description: `Visibility ${fromNode.visibility.visible ? 'Visible' : 'Hidden'} → ${toNode.visibility.visible ? 'Visible' : 'Hidden'}`
          });
        }
      }

      // F. Layer names filter
      if (filters.layerNames) {
        if (toNode.name !== fromNode.name) {
          changes.push({
            group: 'layerNames',
            prop: 'name',
            before: fromNode.name,
            after: toNode.name,
            description: `Renamed "${fromNode.name}" → "${toNode.name}"`
          });
        }
      }

      // Only mark as changed if at least one selected change type matched!
      if (changes.length > 0) {
        items.push({
          id: toNode.id,
          name: toNode.name,
          type: toNode.type,
          path: getLayerPath(toNodes, toNode),
          status: 'changed',
          changes,
          layout: toNode.layout,
          beforeNode: fromNode,
          afterNode: toNode
        });
      }
    }
  }

  // 2. Process layers in snapshotFrom that are NOT in snapshotTo (Removed)
  for (const id of allFromIds) {
    if (!allToIds.has(id)) {
      if (id === snapshotFrom.frameId) continue;
      const fromNode = fromNodes[id];
      items.push({
        id: fromNode.id,
        name: fromNode.name,
        type: fromNode.type,
        path: getLayerPath(fromNodes, fromNode),
        status: 'removed',
        changes: [{
          group: 'layout',
          prop: 'layer',
          before: fromNode.name,
          after: null,
          description: `Layer deleted`
        }],
        layout: fromNode.layout,
        beforeNode: fromNode,
        afterNode: null
      });
    }
  }

  const changed = items.filter(i => i.status === 'changed').length;
  const added = items.filter(i => i.status === 'added').length;
  const removed = items.filter(i => i.status === 'removed').length;

  return {
    summary: {
      changed,
      added,
      removed,
      total: items.length
    },
    items
  };
}

// Canvas Highlights Manager
const HIGHLIGHT_CONTAINER_NAME = "DeltaLog Highlights (locked)";

function clearCanvasHighlights() {
  try {
    const existing = figma.currentPage.children.filter(c => c.name === HIGHLIGHT_CONTAINER_NAME);
    for (const n of existing) {
      n.remove();
    }
  } catch {}
}

async function renderCanvasHighlights(frame: FrameNode | ComponentNode | SectionNode, items: DiffItem[]) {
  clearCanvasHighlights();
  if (!items || items.length === 0) return;

  const frameX = frame.absoluteTransform[0][2];
  const frameY = frame.absoluteTransform[1][2];

  const overlay = figma.createFrame();
  overlay.name = HIGHLIGHT_CONTAINER_NAME;
  overlay.x = frameX;
  overlay.y = frameY;
  overlay.resize(frame.width, frame.height);
  overlay.fills = [];
  overlay.strokes = [];
  overlay.clipsContent = false;
  figma.currentPage.appendChild(overlay);

  for (const item of items) {
    if (!item.layout) continue;

    const isEllipse = item.type === 'ELLIPSE';
    const shape = isEllipse ? figma.createEllipse() : figma.createRectangle();
    shape.name = `[${item.status.toUpperCase()}] ${item.name}`;
    shape.x = item.layout.x;
    shape.y = item.layout.y;
    shape.resize(Math.max(4, item.layout.w), Math.max(4, item.layout.h));

    if (item.status === 'changed') {
      shape.fills = [{ type: 'SOLID', color: { r: 59 / 255, g: 130 / 255, b: 246 / 255 }, opacity: 0.14 }];
      shape.strokes = [{ type: 'SOLID', color: { r: 59 / 255, g: 130 / 255, b: 246 / 255 } }];
      shape.strokeWeight = 1.5;
      shape.strokeAlign = 'INSIDE';
      if (!isEllipse && 'cornerRadius' in shape) {
        shape.cornerRadius = 3;
      }
    } else if (item.status === 'added') {
      shape.fills = [{ type: 'SOLID', color: { r: 34 / 255, g: 197 / 255, b: 94 / 255 }, opacity: 0.14 }];
      shape.strokes = [{ type: 'SOLID', color: { r: 34 / 255, g: 197 / 255, b: 94 / 255 } }];
      shape.strokeWeight = 1.5;
      shape.strokeAlign = 'INSIDE';
      if (!isEllipse && 'cornerRadius' in shape) {
        shape.cornerRadius = 3;
      }
    } else if (item.status === 'removed') {
      shape.fills = [{ type: 'SOLID', color: { r: 239 / 255, g: 68 / 255, b: 68 / 255 }, opacity: 0.08 }];
      shape.strokes = [{ type: 'SOLID', color: { r: 239 / 255, g: 68 / 255, b: 68 / 255 } }];
      shape.strokeWeight = 1.5;
      shape.dashPattern = [4, 4];
      shape.strokeAlign = 'INSIDE';
      if (!isEllipse && 'cornerRadius' in shape) {
        shape.cornerRadius = 3;
      }
    }

    overlay.appendChild(shape);
  }

  overlay.locked = true;
}

// Selection updater
async function updateSelection() {
  const trackedFrames = await getTrackedFramesList();
  const selection: readonly SceneNode[] = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: "selection-update",
      status: "EMPTY",
      trackedFrames
    });
    return;
  }

  if (selection.length > 1) {
    figma.ui.postMessage({
      type: "selection-update",
      status: "MULTIPLE",
      message: "Multiple items selected. Please select one frame.",
      trackedFrames
    });
    return;
  }

  const selectedNode = selection[0];

  if (selectedNode.type === "FRAME" || selectedNode.type === "COMPONENT" || selectedNode.type === "SECTION") {
    const id: string = selectedNode.id;
    const name: string = selectedNode.name;
    const w: number = Math.round(selectedNode.width);
    const h: number = Math.round(selectedNode.height);
    const layerCount: number = selectedNode.findAll().length;
    const versions = getFrameVersions(selectedNode);
    const hasSavedVersion: boolean = versions.length > 0;
    const latestVersion = hasSavedVersion ? versions[versions.length - 1].version : null;

    // Send immediate metadata so UI is instant
    figma.ui.postMessage({
      type: "selection-update",
      status: "LOADED",
      id: id,
      name: name,
      w: w,
      h: h,
      layerCount: layerCount,
      hasSavedVersion: hasSavedVersion,
      latestVersion: latestVersion,
      versionsCount: versions.length,
      versions: versions,
      userName: figma.currentUser?.name || "Designer",
      trackedFrames
    });

    // Export thumbnail asynchronously and push to UI
    getFrameThumbnail(selectedNode).then((thumb) => {
      figma.ui.postMessage({
        type: "thumbnail-update",
        id: id,
        thumbnail: thumb
      });
    });
    return;
  }

  // Child selected inside frame
  const parentFrame = findTopLevelFrame(selectedNode);
  if (parentFrame) {
    figma.ui.postMessage({
      type: "selection-update",
      status: "CHILD_SELECTED",
      selectedNodeName: selectedNode.name,
      parentFrameId: parentFrame.id,
      parentFrameName: parentFrame.name,
      message: `Selected "${selectedNode.name}" inside "${parentFrame.name}". Pick the top-level frame.`,
      trackedFrames
    });
    return;
  }

  figma.ui.postMessage({
    type: "selection-update",
    status: "NOT_FRAME",
    message: "Selected element is not a frame. Pick a top-level frame.",
    trackedFrames
  });
}

// Event listeners
figma.on("selectionchange", () => {
  updateSelection();
});

updateSelection();

// Message Bridge
figma.ui.onmessage = async (msg: { type: string; [key: string]: any }) => {
  switch (msg.type) {
    case "GET_CURRENT_SELECTION":
      updateSelection();
      break;

    case "SELECT_FRAME":
      if (msg.id) {
        const node = (await figma.getNodeByIdAsync(msg.id)) as SceneNode | null;
        if (node) {
          figma.currentPage.selection = [node];
          figma.viewport.scrollAndZoomIntoView([node]);
        }
      }
      break;

    case "SAVE_VERSION": {
      const { frameId, version, label, note, keepFullCopy, compareAfter } = msg;
      const frame = (await figma.getNodeByIdAsync(frameId)) as (FrameNode | ComponentNode | SectionNode) | null;
      if (!frame) {
        figma.ui.postMessage({ type: "SAVE_VERSION_ERROR", error: "Frame not found on canvas." });
        return;
      }

      try {
        const author = figma.currentUser?.name || "Anonymous";
        const createdAt = new Date().toISOString();

        // 1. Clone milestone if requested
        let cloneNodeId: string | undefined = undefined;
        if (keepFullCopy) {
          const cloneId = await cloneFrameMilestone(frame, version);
          if (cloneId) cloneNodeId = cloneId;
        }

        // 2. Serialize frame nodes
        const nodes = serializeFrame(frame);
        const snapshot: VersionSnapshot = {
          frameId: frame.id,
          version,
          label,
          note: note || '',
          author,
          createdAt,
          cloneNodeId,
          nodes
        };

        const jsonString = JSON.stringify(snapshot);
        const sizeKb = Math.round((jsonString.length / 1024) * 10) / 10;

        // Check Figma 100 kB limit
        if (jsonString.length > 100000) {
          figma.ui.postMessage({
            type: "SAVE_VERSION_ERROR",
            error: "Snapshot exceeds Figma's 100 kB limit. Please simplify or split this large frame."
          });
          return;
        }

        // 3. Save snapshot to frame plugin data
        frame.setPluginData(`deltalog_ver_${version}`, jsonString);

        // 4. Update frame's version index
        const currentVersions = getFrameVersions(frame);
        const newIndexItem: VersionIndexItem = {
          version,
          label,
          note: note || '',
          author,
          createdAt,
          cloneNodeId,
          layerCount: Object.keys(nodes).length,
          sizeKb
        };
        const updatedVersions = [...currentVersions, newIndexItem];
        frame.setPluginData(DELTALOG_INDEX_KEY, JSON.stringify(updatedVersions));

        // 5. Update document-level global index
        const globalRaw = figma.root.getPluginData(DELTALOG_GLOBAL_KEY);
        const globalList: GlobalVersionEntry[] = globalRaw ? JSON.parse(globalRaw) : [];
        globalList.push({
          frameId: frame.id,
          version,
          createdAt,
          cloneNodeId
        });
        figma.root.setPluginData(DELTALOG_GLOBAL_KEY, JSON.stringify(globalList));

        // 6. Enforce global 15-version FIFO cap
        await enforceGlobalLimit();

        // 7. Notify UI of success
        figma.ui.postMessage({
          type: "SAVE_VERSION_SUCCESS",
          version,
          author,
          sizeKb,
          compareAfter: !!compareAfter,
          versionsCount: updatedVersions.length
        });

        // Trigger selection refresh so Home screen has updated versions
        updateSelection();
      } catch (err: any) {
        console.error("DeltaLog save error:", err);
        figma.ui.postMessage({
          type: "SAVE_VERSION_ERROR",
          error: err?.message || "Failed to save version snapshot."
        });
      }
      break;
    }

    case "RUN_COMPARE": {
      const { frameId, mode, fromVersion, toVersion, filters } = msg;
      const frame = (await figma.getNodeByIdAsync(frameId)) as (FrameNode | ComponentNode | SectionNode) | null;
      if (!frame) {
        figma.ui.postMessage({ type: "COMPARE_ERROR", error: "Frame not found on canvas." });
        return;
      }

      try {
        // 1. Get snapshotFrom
        const fromRaw = frame.getPluginData(`deltalog_ver_${fromVersion}`);
        if (!fromRaw) {
          figma.ui.postMessage({ type: "COMPARE_ERROR", error: `Version ${fromVersion} data not found.` });
          return;
        }
        const snapshotFrom: VersionSnapshot = JSON.parse(fromRaw);

        // 2. Get snapshotTo
        let snapshotTo: VersionSnapshot;
        if (mode === 'version-vs-current') {
          const liveNodes = serializeFrame(frame);
          snapshotTo = {
            frameId: frame.id,
            version: 'Current',
            label: 'minor',
            note: 'Live on canvas',
            author: figma.currentUser?.name || 'You',
            createdAt: new Date().toISOString(),
            nodes: liveNodes
          };
        } else {
          const toRaw = frame.getPluginData(`deltalog_ver_${toVersion}`);
          if (!toRaw) {
            figma.ui.postMessage({ type: "COMPARE_ERROR", error: `Version ${toVersion} data not found.` });
            return;
          }
          snapshotTo = JSON.parse(toRaw);
        }

        // 3. Generate thumbnails for side-by-side preview
        let fromThumbnail: string | null = null;
        let toThumbnail: string | null = null;

        const currentVersions = getFrameVersions(frame);
        const fromItem = currentVersions.find(v => v.version === fromVersion);
        if (fromItem?.cloneNodeId) {
          try {
            const cloneNode = await figma.getNodeByIdAsync(fromItem.cloneNodeId) as SceneNode | null;
            if (cloneNode) fromThumbnail = await getFrameThumbnail(cloneNode);
          } catch {}
        }

        if (mode === 'version-vs-current') {
          toThumbnail = await getFrameThumbnail(frame);
        } else {
          const toItem = currentVersions.find(v => v.version === toVersion);
          if (toItem?.cloneNodeId) {
            try {
              const cloneNode = await figma.getNodeByIdAsync(toItem.cloneNodeId) as SceneNode | null;
              if (cloneNode) toThumbnail = await getFrameThumbnail(cloneNode);
            } catch {}
          }
        }

        // 4. Run Diff Engine (strictly using selected change types in filters!)
        const diffResult = diffSnapshots(snapshotFrom, snapshotTo, filters);

        // 5. Render canvas highlights by default
        await renderCanvasHighlights(frame, diffResult.items);

        // 6. Post result to UI
        figma.ui.postMessage({
          type: "COMPARE_RESULT_SUCCESS",
          diff: {
            frameId: frame.id,
            frameName: frame.name,
            fromVersion,
            toVersion: mode === 'version-vs-current' ? 'Current' : toVersion,
            fromThumbnail,
            toThumbnail,
            summary: diffResult.summary,
            items: diffResult.items,
            appliedFilters: filters
          }
        });
      } catch (err: any) {
        console.error("DeltaLog compare error:", err);
        figma.ui.postMessage({
          type: "COMPARE_ERROR",
          error: err?.message || "Failed to compare versions."
        });
      }
      break;
    }

    case "TOGGLE_CANVAS_HIGHLIGHTS": {
      const { frameId, enabled, items } = msg;
      if (!enabled) {
        clearCanvasHighlights();
      } else {
        const frame = (await figma.getNodeByIdAsync(frameId)) as (FrameNode | ComponentNode | SectionNode) | null;
        if (frame && items) {
          await renderCanvasHighlights(frame, items);
        }
      }
      break;
    }

    case "CLEAR_CANVAS_HIGHLIGHTS": {
      clearCanvasHighlights();
      break;
    }

    case "LOCATE_NODE": {
      if (msg.nodeId) {
        try {
          const node = (await figma.getNodeByIdAsync(msg.nodeId)) as SceneNode | null;
          if (node) {
            figma.currentPage.selection = [node];
            figma.viewport.scrollAndZoomIntoView([node]);
          } else {
            figma.notify("Layer not found on current page");
          }
        } catch {}
      }
      break;
    }

    case "RESTORE_VERSION": {
      const { frameId, version } = msg;
      try {
        const frame = (await figma.getNodeByIdAsync(frameId)) as (FrameNode | ComponentNode | SectionNode) | null;
        if (!frame) {
          figma.notify("Original frame not found on canvas.");
          return;
        }

        const versions = getFrameVersions(frame);
        const item = versions.find(v => v.version === version);

        if (item && item.cloneNodeId) {
          const snapshotsPage = figma.root.children.find(p => p.name === SNAPSHOTS_PAGE_NAME);
          if (snapshotsPage) {
            await snapshotsPage.loadAsync();
          }

          const clone = (await figma.getNodeByIdAsync(item.cloneNodeId)) as (FrameNode | ComponentNode | SectionNode) | null;
          if (clone) {
            const restored = clone.clone();
            figma.currentPage.appendChild(restored);
            restored.x = frame.x + frame.width + 100;
            restored.y = frame.y;
            restored.name = `[Restored ${version}] ${frame.name}`;
            figma.currentPage.selection = [restored];
            figma.viewport.scrollAndZoomIntoView([restored]);
            figma.notify(`Restored ${version} beside the original frame on canvas`);
            return;
          }
        }

        figma.notify(`Visual snapshot clone not found for ${version}.`);
      } catch (err: any) {
        console.error("DeltaLog restore error:", err);
        figma.notify("Failed to restore version snapshot.");
      }
      break;
    }

    case "DELETE_VERSION": {
      const { frameId, version } = msg;
      try {
        const frame = (await figma.getNodeByIdAsync(frameId)) as (FrameNode | ComponentNode | SectionNode) | null;
        if (frame) {
          const versions = getFrameVersions(frame);
          const targetItem = versions.find(v => v.version === version);

          if (targetItem && targetItem.cloneNodeId) {
            try {
              const snapshotsPage = figma.root.children.find(p => p.name === SNAPSHOTS_PAGE_NAME);
              if (snapshotsPage) await snapshotsPage.loadAsync();
              const cloneNode = await figma.getNodeByIdAsync(targetItem.cloneNodeId);
              if (cloneNode) cloneNode.remove();
            } catch {}
          }

          frame.setPluginData(`deltalog_ver_${version}`, "");
          const remaining = versions.filter(v => v.version !== version);
          frame.setPluginData(DELTALOG_INDEX_KEY, JSON.stringify(remaining));
        }

        const globalRaw = figma.root.getPluginData(DELTALOG_GLOBAL_KEY);
        if (globalRaw) {
          const globalList: GlobalVersionEntry[] = JSON.parse(globalRaw);
          const updatedGlobal = globalList.filter(entry => !(entry.frameId === frameId && entry.version === version));
          figma.root.setPluginData(DELTALOG_GLOBAL_KEY, JSON.stringify(updatedGlobal));
        }

        figma.notify(`Deleted version ${version}`);
        await updateSelection();
      } catch (err: any) {
        console.error("DeltaLog delete version error:", err);
        figma.notify("Failed to delete version.");
      }
      break;
    }

    case "CLEAR_ALL_HISTORY": {
      try {
        const globalRaw = figma.root.getPluginData(DELTALOG_GLOBAL_KEY);
        if (globalRaw) {
          const globalList: GlobalVersionEntry[] = JSON.parse(globalRaw);
          for (const entry of globalList) {
            try {
              const frameNode = await figma.getNodeByIdAsync(entry.frameId);
              if (frameNode) {
                frameNode.setPluginData(`deltalog_ver_${entry.version}`, "");
                frameNode.setPluginData(DELTALOG_INDEX_KEY, "");
              }
            } catch {}
          }
        }

        figma.root.setPluginData(DELTALOG_GLOBAL_KEY, "");

        const snapshotsPage = figma.root.children.find(p => p.name === SNAPSHOTS_PAGE_NAME);
        if (snapshotsPage) {
          try {
            snapshotsPage.remove();
          } catch {}
        }

        figma.notify("Cleared all DeltaLog history in this file.");
        await updateSelection();
      } catch (err: any) {
        console.error("DeltaLog clear history error:", err);
        figma.notify("Failed to clear history.");
      }
      break;
    }

    case "REQUEST_EXPORT_DATA": {
      const { frameId } = msg;
      try {
        figma.notify("Preparing export package...");
        
        const snapshotsPage = figma.root.children.find(p => p.name === SNAPSHOTS_PAGE_NAME);
        if (snapshotsPage) {
          await snapshotsPage.loadAsync();
        }

        const pngPreviews: Record<string, string> = {};
        const svgVectors: Record<string, string> = {};
        const versionsData: any[] = [];
        let exportFrameName = "Document";

        if (frameId) {
          const frame = (await figma.getNodeByIdAsync(frameId)) as (FrameNode | ComponentNode | SectionNode) | null;
          if (frame) {
            exportFrameName = frame.name;
            const versions = getFrameVersions(frame);
            for (const v of versions) {
              const rawData = frame.getPluginData(`deltalog_ver_${v.version}`);
              versionsData.push({
                metadata: v,
                snapshot: rawData ? JSON.parse(rawData) : null
              });

              if (v.cloneNodeId) {
                try {
                  const clone = (await figma.getNodeByIdAsync(v.cloneNodeId)) as SceneNode | null;
                  if (clone && 'exportAsync' in clone) {
                    const pngBytes = await clone.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1 } });
                    pngPreviews[v.version] = uint8ArrayToBase64(pngBytes);

                    const svgBytes = await clone.exportAsync({ format: 'SVG', svgIdAttribute: true });
                    svgVectors[v.version] = uint8ArrayToBase64(svgBytes);
                  }
                } catch {}
              }
            }
          }
        } else {
          const globalRaw = figma.root.getPluginData(DELTALOG_GLOBAL_KEY);
          const globalList: GlobalVersionEntry[] = globalRaw ? JSON.parse(globalRaw) : [];
          
          for (const entry of globalList) {
            try {
              const frame = await figma.getNodeByIdAsync(entry.frameId);
              if (frame) {
                const rawData = frame.getPluginData(`deltalog_ver_${entry.version}`);
                versionsData.push({
                  frameId: entry.frameId,
                  frameName: frame.name,
                  version: entry.version,
                  snapshot: rawData ? JSON.parse(rawData) : null
                });

                if (entry.cloneNodeId) {
                  const clone = (await figma.getNodeByIdAsync(entry.cloneNodeId)) as SceneNode | null;
                  if (clone && 'exportAsync' in clone) {
                    const pngBytes = await clone.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1 } });
                    pngPreviews[`${frame.name}-${entry.version}`] = uint8ArrayToBase64(pngBytes);

                    const svgBytes = await clone.exportAsync({ format: 'SVG', svgIdAttribute: true });
                    svgVectors[`${frame.name}-${entry.version}`] = uint8ArrayToBase64(svgBytes);
                  }
                }
              }
            } catch {}
          }
        }

        figma.ui.postMessage({
          type: "EXPORT_ZIP_DATA_READY",
          isGlobal: !frameId,
          frameName: exportFrameName,
          versionsData,
          pngPreviews,
          svgVectors
        });
      } catch (err: any) {
        console.error("DeltaLog export zip error:", err);
        figma.notify("Failed to export history package.");
      }
      break;
    }

    case "NOTIFY":
      if (msg.message) {
        figma.notify(msg.message);
      }
      break;

    case "CLOSE":
      clearCanvasHighlights();
      figma.closePlugin();
      break;

    default:
      console.warn("DeltaLog: Unknown message:", msg.type);
      break;
  }
};

figma.on("close", () => {
  clearCanvasHighlights();
});

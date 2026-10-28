figma.showUI(__html__, { width: 360, height: 600, themeColors: true });

// Plugin Data keys
const DELTALOG_INDEX_KEY = "deltalog_index";

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

// Find top-level frame if a nested child was selected
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

function updateSelection() {
  const selection: readonly SceneNode[] = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: "selection-update",
      status: "EMPTY"
    });
    return;
  }

  if (selection.length > 1) {
    figma.ui.postMessage({
      type: "selection-update",
      status: "MULTIPLE",
      message: "Multiple items selected. Please select one frame."
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
    const hasSavedVersion: boolean = hasHistory(selectedNode);

    figma.ui.postMessage({
      type: "selection-update",
      status: "LOADED",
      id: id,
      name: name,
      w: w,
      h: h,
      layerCount: layerCount,
      hasSavedVersion: hasSavedVersion
    });
    return;
  }

  // If a child node inside a frame was selected
  const parentFrame = findTopLevelFrame(selectedNode);
  if (parentFrame) {
    figma.ui.postMessage({
      type: "selection-update",
      status: "CHILD_SELECTED",
      selectedNodeName: selectedNode.name,
      parentFrameId: parentFrame.id,
      parentFrameName: parentFrame.name,
      message: `Selected "${selectedNode.name}" inside "${parentFrame.name}". Pick the top-level frame.`
    });
    return;
  }

  // Not a frame or inside a frame (e.g. standalone shape/sticky/etc.)
  figma.ui.postMessage({
    type: "selection-update",
    status: "NOT_FRAME",
    message: "Selected element is not a frame. Pick a top-level frame."
  });
}


figma.on("selectionchange", () => {
  updateSelection();
});

//Check selection immediately on plugin open
updateSelection();

//Handle messages from UI
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

    case "NOTIFY":
      if (msg.message) {
        figma.notify(msg.message);
      }
      break;

    case "CLOSE":
      figma.closePlugin();
      break;

    default:
      console.warn("Unknown message type received from UI:", msg.type);
      break;
  }
};

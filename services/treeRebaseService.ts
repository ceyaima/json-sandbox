import { TreeNode, RebaseDiffResult } from '../types';

export function calculateTreeMetrics(nodes: TreeNode[]): {
  nodeCount: number;
  maxDepth: number;
  branchCount: number;
} {
  let count = 0;
  let maxD = 0;
  let leaves = 0;

  function traverse(node: TreeNode, depth: number) {
    count++;
    if (depth > maxD) maxD = depth;
    if (!node.children || node.children.length === 0) {
      leaves++;
    } else {
      for (const child of node.children) {
        traverse(child, depth + 1);
      }
    }
  }

  for (const root of nodes) {
    traverse(root, 1);
  }

  return {
    nodeCount: count,
    maxDepth: maxD,
    branchCount: leaves,
  };
}

/**
 * Intelligent N-ary rebase:
 * Matches nodes by ID or normalized (type + content).
 * Merges new children from the incoming tree into the base tree without losing base notes.
 * Flags newly added nodes with _isNew = true for visual diffing.
 */
export function rebaseTrees(
  baseTrees: TreeNode[],
  incomingTrees: TreeNode[]
): RebaseDiffResult {
  let addedCount = 0;
  let modifiedCount = 0;
  let matchedCount = 0;
  const diffList: RebaseDiffResult['diffList'] = [];

  // Build index map of base nodes for rapid matching
  const baseMap = new Map<string, TreeNode>();

  function indexBase(node: TreeNode, path: string) {
    const keyId = String(node.id);
    baseMap.set(keyId, node);
    const signature = `${node.type}:::${node.content.trim().slice(0, 100)}`;
    baseMap.set(signature, node);

    if (node.children) {
      node.children.forEach((c, idx) => indexBase(c, `${path}/${node.id}`));
    }
  }

  baseTrees.forEach((root) => indexBase(root, ''));

  function mergeNode(
    incomingNode: TreeNode,
    parentPath: string
  ): TreeNode {
    const keyId = String(incomingNode.id);
    const signature = `${incomingNode.type}:::${incomingNode.content.trim().slice(0, 100)}`;
    const matchedBase = baseMap.get(keyId) || baseMap.get(signature);

    if (!matchedBase) {
      // Completely new node
      addedCount++;
      diffList.push({
        id: incomingNode.id,
        action: 'added',
        content: incomingNode.content || `[${incomingNode.type} Node ${incomingNode.id}]`,
        parentPath: parentPath || 'root'
      });

      const newChildren = (incomingNode.children || []).map((ch) =>
        mergeNode(ch, `${parentPath}/${incomingNode.id}`)
      );

      return {
        ...incomingNode,
        _isNew: true,
        children: newChildren
      };
    } else {
      // Node already exists in base
      matchedCount++;
      const isModified =
        (matchedBase.content !== incomingNode.content && Boolean(incomingNode.content)) ||
        (matchedBase.thought !== incomingNode.thought && Boolean(incomingNode.thought));

      if (isModified) {
        modifiedCount++;
        diffList.push({
          id: incomingNode.id,
          action: 'modified',
          content: incomingNode.content,
          parentPath: parentPath || 'root'
        });
      }

      // Merge children: preserve existing base children, append or rebase with incoming children
      const mergedChildren: TreeNode[] = [];
      const incomingChildren = incomingNode.children || [];
      const baseChildren = matchedBase.children || [];

      // Track matched incoming IDs
      const incomingHandled = new Set<string>();

      // First pass: match base children with incoming children
      for (const bChild of baseChildren) {
        const matchingIncoming = incomingChildren.find(
          (inc) =>
            String(inc.id) === String(bChild.id) ||
            (`${inc.type}:::${inc.content.trim().slice(0, 100)}` ===
              `${bChild.type}:::${bChild.content.trim().slice(0, 100)}`)
        );

        if (matchingIncoming) {
          incomingHandled.add(String(matchingIncoming.id));
          mergedChildren.push(mergeNode(matchingIncoming, `${parentPath}/${incomingNode.id}`));
        } else {
          // Keep existing base child even if not in incoming
          mergedChildren.push(bChild);
        }
      }

      // Second pass: attach any entirely new children from incoming
      for (const incChild of incomingChildren) {
        if (!incomingHandled.has(String(incChild.id))) {
          mergedChildren.push(mergeNode(incChild, `${parentPath}/${incomingNode.id}`));
        }
      }

      return {
        ...matchedBase,
        content: incomingNode.content || matchedBase.content,
        thought: incomingNode.thought !== undefined ? incomingNode.thought : matchedBase.thought,
        _isModified: isModified,
        children: mergedChildren
      };
    }
  }

  const rebasedTree: TreeNode[] = incomingTrees.map((incRoot) =>
    mergeNode(incRoot, '')
  );

  return {
    addedNodesCount: addedCount,
    modifiedNodesCount: modifiedCount,
    unchangedNodesCount: matchedCount - modifiedCount,
    rebasedTree,
    diffList
  };
}

export function extractConversationPaths(roots: TreeNode[]): {
  id: string;
  leafNodeId: number | string;
  summary: string;
  pathNodes: TreeNode[];
}[] {
  const paths: {
    id: string;
    leafNodeId: number | string;
    summary: string;
    pathNodes: TreeNode[];
  }[] = [];

  function dfs(node: TreeNode, currentPath: TreeNode[]) {
    const updated = [...currentPath, node];
    if (!node.children || node.children.length === 0) {
      const summaryText =
        node.content.slice(0, 70) || `Leaf node #${node.id}`;
      paths.push({
        id: `path-leaf-${node.id}`,
        leafNodeId: node.id,
        summary: summaryText,
        pathNodes: updated
      });
    } else {
      for (const child of node.children) {
        dfs(child, updated);
      }
    }
  }

  for (const root of roots) {
    dfs(root, []);
  }

  return paths;
}

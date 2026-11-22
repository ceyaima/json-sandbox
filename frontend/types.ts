export interface TreeNode {
  id: number | string;
  type: 'user' | 'assistant' | 'system' | string;
  content: string;
  thought?: string | null;
  children: TreeNode[];
  _isNew?: boolean;
  _isModified?: boolean;
}

export interface BranchMeta {
  customName?: string;
  notes?: string;
  tags?: string[];
}

export interface SandboxMetadata {
  aliasName?: string;
  category: string;
  folder?: string;
  tags: string[];
  notes: string;
  nodeAnnotations?: Record<string | number, string>;
  branchMeta?: Record<string, BranchMeta>;
  starredBranches?: string[];
  lastModifiedTimestamp?: number;
}

export interface SandboxFile {
  id: string;
  originalFilename: string;
  filePath?: string;
  rootNodes: TreeNode[];
  metadata: SandboxMetadata;
  nodeCount: number;
  maxDepth: number;
  branchCount: number;
  rawJsonString: string;
}

export interface AppSettings {
  fontSize: 'small' | 'medium' | 'large';
  showThoughts: boolean;
  globalTags: string[];
}

export interface GraphTransformState {
  zoom: number;
  x: number;
  y: number;
  orientation: 'vertical' | 'horizontal';
}

export type FileSortMode = 'title' | 'nodes' | 'tags';

export interface RebaseDiffResult {
  addedNodesCount: number;
  modifiedNodesCount: number;
  unchangedNodesCount: number;
  rebasedTree: TreeNode[];
  diffList: {
    id: number | string;
    action: 'added' | 'modified' | 'matched';
    content: string;
    parentPath: string;
  }[];
}

export type ViewMode = 'graph' | 'thread' | 'raw';

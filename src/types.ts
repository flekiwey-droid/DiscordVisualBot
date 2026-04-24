
import { Node, Edge } from '@xyflow/react';

export type NodeType = 'trigger' | 'action' | 'logic' | 'variable';

export interface NodeData extends Record<string, unknown> {
  label: string;
  type: NodeType;
  description?: string;
  config?: Record<string, any>;
  icon?: string;
}

export type VNode = Node<NodeData>;
export type VEdge = Edge;

export interface NodeCategory {
  id: string;
  label: string;
  nodes: {
    type: string;
    label: string;
    description: string;
    defaultData: NodeData;
  }[];
}

// models/graph.ts

export interface Matrix {
  size: number;
  values: number[][];
}

export interface Graph {
  nodes: string[];
  adjacencyMatrix: Matrix;
}

export interface Path {
  source: string;
  target: string;
  path: string[];
  relationPath: string[];
  distance: number;
}

export interface RelationshipDescription {
  type: string;
  description: string;
}

export const RelationshipTypes = {
  PARENT: "PARENT",
  CHILD: "CHILD",
  SIBLING: "SIBLING",
  SPOUSE: "SPOUSE",
  GRANDPARENT: "GRANDPARENT",
  GRANDCHILD: "GRANDCHILD",
  UNCLE_AUNT: "UNCLE_AUNT",
  NEPHEW_NIECE: "NEPHEW_NIECE",
  COUSIN: "COUSIN"
};

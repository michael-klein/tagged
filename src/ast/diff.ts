import { AST_NODE, StyleMap } from "../types/interfaces";
import { AST_NODE_TYPE } from "../types/enums";
export enum OperationsTypes {
  ADD,
  REMOVE,
  REPLACE,
  CLASSES,
  ID,
  SET_ATTRIBUTE,
  REMOVE_ATTRIBUTE
}
export interface DiffOperations {
  type: OperationsTypes;
  path: string;
  path2?: string;
  node?: AST_NODE;
  classes?: string[];
  id?: string;
  attributeName?: string;
  attributeValue?: string;
}
function getPath(path: string[]): string {
  let result: string = path.join(">").replace(/ /g, "");
  if (result.charAt(0) === ">") result = result.substring(1);
  return result;
}

function getParentPath(node, path: string[]): string {
  const parentNode: AST_NODE = node.parentNode;
  const newPath: string[] = path.slice(0);
  newPath.pop();
  return getPath(newPath);
}

function addToPath(path: string[], val: string): string[] {
  const newPath: string[] = path.slice(0);
  newPath.push(val);
  return newPath;
}
export function replaceNode(
  ast1: AST_NODE,
  ast2: AST_NODE,
  operations: DiffOperations[],
  path: string[]
) {
  operations.push({
    type: OperationsTypes.REPLACE,
    path: getPath(path),
    node: ast2
  });
}
function compareClasses(
  ast1: AST_NODE,
  ast2: AST_NODE,
  operations: DiffOperations[],
  path: string[]
) {
  if (ast1.classes !== undefined) {
    let ast1Classes: string = ast1.classes.join(" ");
    let ast2Classes: string = ast2.classes.join(" ");
    if (ast1Classes !== ast2Classes) {
      operations.push({
        type: OperationsTypes.CLASSES,
        path: getPath(path),
        classes: ast2.classes as string[]
      });
    }
  }
}
function compareIds(
  ast1: AST_NODE,
  ast2: AST_NODE,
  operations: DiffOperations[],
  path: string[]
) {
  if (ast1.id !== ast2.id) {
    operations.push({
      type: OperationsTypes.ID,
      path: getPath(path),
      id: ast2.id as string
    });
  }
}
function getStyleString(styles: StyleMap = {}): string {
  let styleValue: string[] = [];
  Object.keys(styles).forEach((name: string) => {
    styleValue.push(`${name}:${styles[name]}`);
  });
  if (styleValue.length > 0) {
    return styleValue.join(";");
  }
  return "";
}
function compareStyles(
  ast1: AST_NODE,
  ast2: AST_NODE,
  operations: DiffOperations[],
  path: string[]
) {
  const ast1Styles: string = getStyleString(ast1.styles);
  const ast2Styles: string = getStyleString(ast2.styles);
  if (ast1Styles !== ast2Styles) {
    if (Object.keys(ast2Styles).length === 0) {
      operations.push({
        type: OperationsTypes.REMOVE_ATTRIBUTE,
        path: getPath(path),
        attributeName: "style"
      });
    } else {
      operations.push({
        type: OperationsTypes.SET_ATTRIBUTE,
        path: getPath(path),
        attributeName: "style",
        attributeValue: ast2Styles
      });
    }
  }
}
function compareAttributes(
  ast1: AST_NODE,
  ast2: AST_NODE,
  operations: DiffOperations[],
  path: string[]
) {
  if (ast1.attributes !== undefined) {
    const ast1AttributeNames: string[] = Object.keys(ast1.attributes);
    const ast2AttributeNames: string[] = Object.keys(ast2.attributes);
    const attributeNames: string[] = [...ast1AttributeNames];
    ast2AttributeNames.forEach((name: string) => {
      if (attributeNames.indexOf(name) === -1) {
        attributeNames.push(name);
      }
    });
    for (let name of attributeNames) {
      if (
        ast1.attributes[name] !== undefined &&
        ast2.attributes[name] === undefined
      ) {
        operations.push({
          type: OperationsTypes.REMOVE_ATTRIBUTE,
          path: getPath(path),
          attributeName: name
        });
      } else if (ast1.attributes[name] !== ast2.attributes[name]) {
        operations.push({
          type: OperationsTypes.SET_ATTRIBUTE,
          path: getPath(path),
          attributeName: name,
          attributeValue: ast2.attributes[name] as string
        });
      }
    }
  }
}
function compareNodes(
  ast1: AST_NODE,
  ast2: AST_NODE,
  operations: DiffOperations[],
  path: string[]
) {
  compareClasses(ast1, ast2, operations, path);
  compareIds(ast1, ast2, operations, path);
  compareAttributes(ast1, ast2, operations, path);
  compareStyles(ast1, ast2, operations, path);

  if (ast1.children !== undefined) {
    let index1: number = 0;
    let index2: number = 0;
    for (
      let i: number = 0,
        length = Math.max(
          ast1.children ? ast1.children.length : 0,
          ast2.children ? ast2.children.length : 0
        );
      i < length;
      i++
    ) {
      const child1: AST_NODE = ast1.children[i];
      const child2: AST_NODE = ast2.children[i];
      if (child1 && child1.type !== AST_NODE_TYPE.TEXT) {
        index1++;
      }
      if (child2 && child2.type !== AST_NODE_TYPE.TEXT) {
        index2++;
      }
      performDiff(
        ast1.children[i],
        ast2.children[i],
        operations,
        child1 &&
          addToPath(path, child1 && `${child1.tagName}:nth-child(${index1})`),
        child2 &&
          addToPath(path, child2 && `${child2.tagName}:nth-child(${index2})`)
      );
    }
  }
}
function combineTexts(node: AST_NODE): string {
  return node.children === undefined
    ? ""
    : node.children.reduce(
        (memo: string, node: AST_NODE) =>
          memo + node.text ? (node.text as string) : "",
        ""
      );
}
function performDiff(
  ast1: AST_NODE,
  ast2: AST_NODE,
  operations: DiffOperations[],
  path1: string[],
  path2: string[]
) {
  if (ast1 !== undefined && ast2 !== undefined) {
    if (
      combineTexts(ast1) !== combineTexts(ast2) ||
      ast1.tagName !== ast2.tagName
    ) {
      replaceNode(ast1, ast2, operations, path1);
    } else {
      compareNodes(ast1, ast2, operations, path1);
    }
  } else {
    if (ast1 === undefined) {
      operations.push({
        type: OperationsTypes.ADD,
        path: getParentPath(ast2, path2),
        node: ast2
      });
    } else {
      operations.unshift({
        type: OperationsTypes.REMOVE,
        path: getPath(path1)
      });
    }
  }
}
export function diff(ast1: AST_NODE, ast2: AST_NODE): DiffOperations[] {
  const operations: DiffOperations[] = [];
  compareNodes(ast1, ast2, operations, []);
  return operations;
}

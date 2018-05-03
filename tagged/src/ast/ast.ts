import { parseHTML } from "./parser";
import {
  AST_NODE,
  ParsedAttributeMap,
  ASTAttributeMap,
  StyleMap,
  Sources
} from "../types/interfaces";
import { AST_NODE_TYPE } from "../types/enums";

function handleId(
  newNode: AST_NODE,
  nodeStack: AST_NODE[],
  attributes: ParsedAttributeMap
): void {
  if (attributes.id !== undefined) {
    newNode.id = attributes.id;
    delete attributes.id;
  }
}
function handleAttributes(
  newNode: AST_NODE,
  nodeStack: AST_NODE[],
  attributes: ParsedAttributeMap
): void {
  newNode.attributes = Object.keys(attributes).reduce(
    (map: ASTAttributeMap, key: string) => {
      let trimmedValue: string = attributes[key].trim();
      map[key] = trimmedValue;
      return map;
    },
    {}
  );
}
function handleClasses(
  newNode: AST_NODE,
  nodeStack: AST_NODE[],
  attributes: ParsedAttributeMap
): void {
  if (attributes.class !== undefined) {
    let openedExpression: string = "";
    let numOpenBrackets: number = 0;
    newNode.classes = attributes.class.trim().split(/ /g);
    delete attributes.class;
  } else {
    newNode.classes = [];
  }
}
function handleStyles(
  newNode: AST_NODE,
  nodeStack: AST_NODE[],
  attributes: ParsedAttributeMap
): void {
  if (attributes.style !== undefined) {
    newNode.styles = attributes.style
      .split(";")
      .reduce((memo: StyleMap, style: string) => {
        let [name, value] = style.split(":");
        let styleValue: string = value.trim();
        memo[name.trim()] = styleValue;
        return memo;
      }, {});
    delete attributes.style;
  }
}
function addTextNode(text: string, node: AST_NODE, nodeStack: AST_NODE[]) {
  if (text.length > 0) {
    const newNode: AST_NODE = {
      type: AST_NODE_TYPE.TEXT,
      parentNode: node,
      text
    };
    node.children.push(newNode);
  }
}
export function templateToAST(template: string) {
  let nodeStack: AST_NODE[] = [];
  let currentNode: AST_NODE = {
    type: AST_NODE_TYPE.ROOT,
    children: [],
    parentNode: undefined
  };
  let currentText: string = "";
  parseHTML(template, {
    onText(text: string) {
      if (text.replace(/\s/g, "").length !== 0) {
        currentText += text.trim();
      }
    },
    onTagOpen(
      tagName: string,
      attributes: ParsedAttributeMap,
      isUnary: boolean
    ) {
      addTextNode(currentText, currentNode, nodeStack);
      currentText = "";
      const newNode: AST_NODE = {
        type: AST_NODE_TYPE.ELEMENT,
        tagName,
        children: [],
        parentNode: currentNode
      };
      handleId(newNode, nodeStack, attributes);
      handleStyles(newNode, nodeStack, attributes);
      handleClasses(newNode, nodeStack, attributes);
      handleAttributes(newNode, nodeStack, attributes);
      currentNode.children.push(newNode);
      if (!isUnary) {
        nodeStack.push(currentNode);
        currentNode = newNode;
      }
    },
    onTagClose(tagName: string) {
      addTextNode(currentText, currentNode, nodeStack);
      currentText = "";
      if (currentNode.tagName !== tagName) {
        throw new Error("Trying to close tag that wasn't opened!");
      }
      currentNode = nodeStack.pop();
    }
  });
  if (currentNode.type !== AST_NODE_TYPE.ROOT) {
    throw new Error("root node was not closed. Malformed HTML?");
  }
  return currentNode;
}

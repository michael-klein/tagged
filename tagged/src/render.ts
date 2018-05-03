import {
  AST_NODE,
  ASTAttributeMap,
  StyleMap,
  RenderOptions,
  EventHandlerMap
} from "./types/interfaces";
import { AST_NODE_TYPE } from "./types/enums";
import { diff, DiffOperations, OperationsTypes } from "./ast/diff";
function addClasses(node: Element, classes: string[]): void {
  if (classes.length > 0) {
    node.className = classes.join(" ").trim();
  }
}
function setAttribute(node: Element, name:string, value:string, eventHandlers: EventHandlerMap):void {
  if (
    eventHandlers !== undefined &&
    eventHandlers[value] !== undefined &&
    name.indexOf("on") === 0
  ) {
    const eventName: string = name.replace("on", "");
    node.removeAttribute(name);
    if (node['__tagged_handlers'] === undefined) {
      node['__tagged_handlers'] = {};
    }
    if (node['__tagged_handlers'][eventName] !== eventHandlers[value]) {
      node.removeEventListener(eventName, node['__tagged_handlers'][eventName]);
      node['__tagged_handlers'][eventName] = eventHandlers[value];
      node.addEventListener(
        eventName,
        eventHandlers[value]
      );
    } else {
      node.removeEventListener(eventName, eventHandlers[value]);

      node.addEventListener(
        eventName,
        eventHandlers[value]
      );
    }
  } else {
    if (name.indexOf("on") === 0) {
      node.removeAttribute(name);
    } else {
      if (name === 'checked') {
        node['checked'] = true;
      } else {
        node.setAttribute(name, value);
      }
    }
  }
}
function addAttributes(node: Element, attributes: ASTAttributeMap
  eventHandlers: EventHandlerMap): void {
  Object.keys(attributes).forEach((name: string) => {
    const value: string = attributes[name];
    setAttribute(node, name, value, eventHandlers);
  });
}
function addStyles(node: Element, styles: StyleMap = {}): void {
  let styleValue: string[] = [];
  Object.keys(styles).forEach((name: string) => {
    styleValue.push(`${name}:${styles[name]}`);
  });
  if (styleValue.length > 0) {
    node.setAttribute("style", styleValue.join(";"));
  }
}

function renderToNode(ast: AST_NODE,
  eventHandlers: EventHandlerMap): Element | Text | DocumentFragment {
  let newNode: Element | Text | DocumentFragment;
  if (ast.type === AST_NODE_TYPE.ELEMENT) {
    newNode = document.createElement(ast.tagName);
    addClasses(newNode, ast.classes);
    addAttributes(newNode, ast.attributes, eventHandlers);
    addStyles(newNode, ast.styles);
  } else if (ast.type === AST_NODE_TYPE.TEXT) {
    newNode = document.createTextNode(ast.text);
  } else if (ast.type === AST_NODE_TYPE.ROOT) {
    newNode = document.createDocumentFragment();
  }
  if (ast.children) {
    ast.children.forEach((child: AST_NODE) =>
      newNode.appendChild(renderToNode(child, eventHandlers))
    );
  }
  return newNode;
}

function removeAttribute(node:Element, name:string):void {
  if (name === 'checked') {
    node[name] = false;
  } else {
    node.removeAttribute(name);
  }
}

export function handleASTs(
  node: Element | ShadowRoot,
  eventHandlers: EventHandlerMap,
  ast: AST_NODE,
  oldAST?: AST_NODE
): void {
  if (oldAST === undefined) {
    const root: DocumentFragment = renderToNode(
      ast,
      eventHandlers
    ) as DocumentFragment;
    while (root.childNodes.length > 0) {
      node.appendChild(root.childNodes[0]);
    }
  } else {
    const operations: DiffOperations[] = diff(oldAST, ast);
    for (let operation of operations) {
      if (operation.type === OperationsTypes.CLASSES) {
        addClasses(node.querySelector(operation.path), operation.classes);
      } else if (operation.type === OperationsTypes.REPLACE) {
        const child: Element = node.querySelector(operation.path);
        const newChild: Element = renderToNode(
          operation.node,
          eventHandlers
        ) as Element;
        child.parentNode.replaceChild(newChild, child);
      } else if (operation.type === OperationsTypes.REMOVE) {
        const child: Element = node.querySelector(operation.path);
        child.parentNode.removeChild(child);
      } else if (operation.type === OperationsTypes.ADD) {
        const parentNode: Element | ShadowRoot =
          operation.path.length > 0 ? node.querySelector(operation.path) : node;
        parentNode.appendChild(renderToNode(operation.node, eventHandlers));
      } else if (operation.type === OperationsTypes.ID) {
        const child: Element = node.querySelector(operation.path);
        child.id = operation.id;
      } else if (operation.type === OperationsTypes.REMOVE_ATTRIBUTE) {
        const child: Element = node.querySelector(operation.path);
        removeAttribute(child, operation.attributeName);
      } else if (operation.type === OperationsTypes.SET_ATTRIBUTE) {
        const child: Element = node.querySelector(operation.path);
        setAttribute(child, operation.attributeName, operation.attributeValue, eventHandlers);
      }
    }
  }
}

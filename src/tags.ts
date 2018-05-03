import {
  EvaluatedTemplate,
  EventHandlerMap,
  AST_NODE
} from "./types/interfaces";
import { EventHandler, Stream } from "./types/types";
import * as flyd from "flyd";
import { templateToAST } from "./ast/ast";
import { handleASTs } from "./render";
const { stream, on } = flyd;
let handlerIds:number = 0;
function handleValue(
  result: EvaluatedTemplate,
  value: string | EvaluatedTemplate | EventHandler
): string {
  if (value !== undefined) {
    if (typeof value === "object") {
      if (value.eventHandlers !== undefined) {
        Object.assign(result.eventHandlers, value.eventHandlers);
      }
      if (value.html !== undefined) {
        return value.html;
      }
    } else if (typeof value === "function") {
      const id: string = `handler__${handlerIds++}`);
      result.eventHandlers[id] = value;
      return id;
    } else {
      return value;
    }
  }
  return "";
}
export function html(
  parts: TemplateStringsArray,
  ...values
): EvaluatedTemplate {
  const result: EvaluatedTemplate = {
    html: "",
    eventHandlers: {}
  };
  result.html = parts
    .map((part: string, index: number) => {
      const value: string | string[] | EvaluatedTemplate | EventHandler =
        values[index];
      if (value instanceof Array) {
        return part + value.map(handleValue.bind(this, result)).join("");
      } else {
        return part + handleValue(result, value);
      }
    })
    .join("");
  return result;
}
export function render(
  node: HTMLElement,
  template$: flyd.Stream<EvaluatedTemplate>
): void {
  let oldAST: AST_NODE;
  let latestTemplate: EvaluatedTemplate;
  let rendering: boolean = false;
  let waiting: boolean = false;
  function performRender() {
    let ast: AST_NODE = templateToAST(latestTemplate.html);
    handleASTs(node as Element, latestTemplate.eventHandlers, ast, oldAST);
    oldAST = ast;
    rendering = false;
  }
  on((template: EvaluatedTemplate) => {
    latestTemplate = template;
    if (!rendering) {
      rendering = true;
      window.requestAnimationFrame(() => {
        performRender();
      });
    } else {
      if (!waiting) {
        waiting = true;
        window.requestAnimationFrame(() => {
          performRender();
          waiting = false;
        });
      }
    }
  }, template$);
}
export function css(parts: TemplateStringsArray, ...values): string {
  return parts
    .map((part: string, index: number) => {
      const value: string | string[] = values[index];
      if (value !== undefined) {
        if (value instanceof Array) {
          return part + value.join("");
        } else {
          return part + value;
        }
      } else {
        return part;
      }
    })
    .join("");
}

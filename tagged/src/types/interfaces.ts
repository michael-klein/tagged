import * as flyd from "flyd";
import { AST_NODE_TYPE } from "./enums";
import { EventHandler, Stream } from "./types";
export interface StyleMap {
  [key: string]: string;
}
export interface ASTAttributeMap {
  [key: string]: string;
}
export interface ASTDirectiveMap {
  [key: string]: string;
}
export interface AST_NODE {
  type: AST_NODE_TYPE;
  parentNode: AST_NODE;
  tagName?: string;
  children?: AST_NODE[];
  text?: string;
  id?: string;
  classes?: Array<string>;
  attributes?: ASTAttributeMap;
  styles?: StyleMap;
}
export interface ParsedAttributeMap {
  [key: string]: string;
}
export interface HTMLParserOptions {
  onTagOpen?: (
    tagName: string,
    attributes: ParsedAttributeMap,
    isUnary: boolean
  ) => void;
  onTagClose?: (tagName: string) => void;
  onText?: (text: string) => void;
  onComment?: (text: string) => void;
}
export interface EventHandlerMap {
  [key: string]: EventHandler;
}
export interface EvaluatedTemplate {
  html: string;
  eventHandlers: EventHandlerMap;
}
export interface RenderOptions {
  onAttribute: (node: Element, key: string) => void;
}
export interface ComponentOptions {
  name: string;
  observedAttributes?: string[];
}
export interface AttributeMap {
  [key: string]: string;
}
export interface Sources {
  attributes$: Stream<AttributeMap>;
}
export interface Sinks {
  template$: Stream<EvaluatedTemplate>;
  css$?: Stream<string>;
}

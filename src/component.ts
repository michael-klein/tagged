import { ComponentOptions, Sources, Sinks, AttributeMap } from "./types/interfaces";
import { render, css} from './tags';
import * as flyd from "flyd";
const { stream, on } = flyd;
export function component(
  options: ComponentOptions,
  controller: (sources:Sources) => Sinks
) {
  options = Object.assign(
    {
      observedAttributes: []
    },
    options
  );
  if (options.name === undefined) {
    throw new Error('No component name defined!');
  }
  window.customElements.define(
    options.name,
    class extends HTMLElement {
      private connected: boolean = false;
      private attributesMap: AttributeMap = {}
      private sources: Sources = {
        attributes$: stream();
      }
      constructor() {
        super();
        const sinks:Sinks = controller(this.sources);
        const shadowRoot: ShadowRoot = this.attachShadow({ mode: 'open' });
        const containerSpan:HTMLSpanElement = document.createElement('span');
        shadowRoot.appendChild(containerSpan);
        render(containerSpan, sinks.template$);

        if (sinks.css$ !== undefined) {
          const styleContainer:HTMLStyleElement = document.createElement('style');
          shadowRoot.appendChild(styleContainer);
          on((css: string) => styleContainer.innerHTML = css,sinks.css$);
        }
      }
      static get observedAttributes() {
        return options.observedAttributes;
      }
      connectedCallback(): void {
        for (let attr of options.observedAttributes) {
          this.attributesMap[attr] = this.getAttribute(attr);
        }
        this.sources.attributes$(Object.assign({}, this.attributesMap));
        this.connected = true;
      }

      disconnectedCallback(): void {
        this.connected = false;
      }

      adoptedCallback(): void {}

      attributeChangedCallback(name: string, oldVal: any, newVal: any): void {
        if (oldVal !== newVal && this.connected) {
          this.attributesMap[name] = newVal;
          this.sources.attributes$(Object.assign({}, this.attributesMap));
        }
      }
    }
  );
}

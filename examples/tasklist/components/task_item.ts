import { html, EvaluatedTemplate, Sources, component } from "../../../src/";
import { Stream } from "../../tagged/src/types/types";
import * as flyd from "flyd";
import "./add_task";
const { stream, on } = flyd;
import { state$, State, toggleChecked, removeTask } from "../store";
component(
  {
    name: "task-item",
    observedAttributes: ["label", "completed", "taskid"]
  },
  (sources: Sources) => {
    const template$: Stream<EvaluatedTemplate> = sources.attributes$.map(
      attributes => {
        const completed: boolean = attributes.completed === "true";
        function onCheckboxClicked(e: Event) {
          e.preventDefault();
          toggleChecked(attributes.taskid);
        }
        function onDestroyClicked(e: Event) {
          e.preventDefault();
          removeTask(attributes.taskid);
        }
        return html`<div class="item ${
          completed ? "completed" : ""
        }"><input onclick="${onCheckboxClicked}" ${
          completed ? "checked" : ""
        } type="checkbox"><span>${
          attributes.label
        }</span><button onclick="${onDestroyClicked}" class="destroy">x</button></div>`;
      }
    );
    return {
      template$,
      css$: stream(`
        div.item {
          display: flex;
          align-items: center;
          color: rgb(77, 77, 77);
          transition: color 0.4s;
          font-size:24px;
          position: relative;
          height: 100%;
          height: 50px;
        }
        div.item.completed {
          text-decoration: line-through;
          color: #d9d9d9;
        }
        div.item button.destroy {
          position: absolute;
          top: 0;
          right: 10px;
          bottom: 0;
          width: 40px;
          height: 40px;
          margin: auto 0;
          font-size: 30px;
          color: #cc9a9a;
          transition: color 0.2s ease-out;
          padding: 0;
          border: 0;
          background: none;
          vertical-align: baseline;
          -webkit-appearance: none;
          appearance: none;
          -webkit-font-smoothing: antialiased;
          -moz-font-smoothing: antialiased;
          font-smoothing: antialiased;
          cursor:pointer;
          display:none;
        }
        div.item:hover button.destroy {
          display: block;
        }
        input {
          text-align: center;
          width: 40px;
          height: 40px;
          border: none;
          -webkit-appearance: none;
          cursor:pointer;
          margin-right:8px;
        }
        input:focus {
          outline: 0;
        }
        input:after {
	        content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="-10 -18 100 135"><circle cx="50" cy="50" r="50" fill="none" stroke="#ededed" stroke-width="3"/></svg>');
        }
        div.item.completed input:after {
          	content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="-10 -18 100 135"><circle cx="50" cy="50" r="50" fill="none" stroke="#bddad5" stroke-width="3"/><path fill="#5dc2af" d="M72 25L42 71 27 56l-4 4 20 20 34-52z"/></svg>');
        }
      `)
    };
  }
);

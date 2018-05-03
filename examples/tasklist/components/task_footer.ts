import { html, EvaluatedTemplate, Sources, component } from "../../../src/";
import { Stream } from "../../tagged/src/types/types";
import * as flyd from "flyd";
import "./add_task";
const { stream, on } = flyd;
import {
  state$,
  State,
  toggleChecked,
  removeTask,
  TaskFilter,
  setTaskFilter
} from "../store";
function getButtonClass(
  activeFilter: TaskFilter,
  compareFilter: TaskFilter
): string {
  if (activeFilter === compareFilter) {
    return "selected";
  }
  return "";
}
component(
  {
    name: "task-footer",
    observedAttributes: ["label", "completed", "taskid"]
  },
  (sources: Sources) => {
    const template$: Stream<EvaluatedTemplate> = state$.map(state => {
      const numLeft: number = state.tasks.filter(task => !task.completed)
        .length;
      return html`
      <div class="task-footer">
        <div class="num-left">${numLeft} item${
        numLeft > 1 ? "s" : ""
      } left</div>
        <div class="toggles">
          <button class="${getButtonClass(
            state.taskFilter,
            TaskFilter.ALL
          )}" onclick="${() => setTaskFilter(TaskFilter.ALL)}">All</button>
          <button class="${getButtonClass(
            state.taskFilter,
            TaskFilter.ACTIVE
          )}" onclick="${() =>
        setTaskFilter(TaskFilter.ACTIVE)}">Active</button>
          <button class="${getButtonClass(
            state.taskFilter,
            TaskFilter.COMPLETED
          )}" onclick="${() =>
        setTaskFilter(TaskFilter.COMPLETED)}">Completed</button>
        </div>
      </div>`;
    });
    return {
      template$,
      css$: stream(`
        div.task-footer {
          color: #777;
          padding: 10px 15px;
          height: 20px;
          border-top: 1px solid #e6e6e6;
          display: flex;
          align-items: center;
          font-size: 14px;
        }
        div.num-left {
          flex: 1;
        }
        div.toggles {
          flex:auto;
        }
        div.toggles button {
          color: inherit;
          margin: 3px;
          padding: 3px 7px;
          text-decoration: none;
          border: 1px solid transparent;
          border-radius: 3px;
          font-size: 14px;
          background: none;
          cursor:pointer;
        }
        div.toggles button:focus {
          outline: 0;
        }
        div.toggles button:hover {
          border-color: rgba(175, 47, 47, 0.1);
        }
        div.toggles button.selected {
          border-color: rgba(175, 47, 47, 0.2);
        }
      `)
    };
  }
);

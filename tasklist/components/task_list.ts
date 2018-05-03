import { html, EvaluatedTemplate, Sources, component } from "../../tagged/src/";
import { Stream } from "../../tagged/src/types/types";
import * as flyd from "flyd";
import "./add_task";
import "./task_item";
import "./task_footer";
const { stream, on } = flyd;
import { state$, State, Task, TaskFilter } from "../store";
import * as arraySort from "array-sort";
component(
  {
    name: "task-list"
  },
  (sources: Sources) => {
    const template$: Stream<EvaluatedTemplate> = state$.map((state: State) => {
      const sortedTasks: Task[] = arraySort(
        state.tasks.filter(task => {
          switch (state.taskFilter) {
            case TaskFilter.ALL:
              return true;
            case TaskFilter.ACTIVE:
              return !task.completed;
            case TaskFilter.COMPLETED:
              return task.completed;
          }
        }),
        (t1: Task, t2: Task) => {
          const ts1: number = t1.timestamp * (t1.completed ? 1 : 2);
          const ts2: number = t2.timestamp * (t2.completed ? 1 : 2);
          return ts1 < ts2;
        }
      );
      return html`
      <main>
          <h1>
            todos
          </h1>
          <ul>
            <li>
              <add-task></add-task>
            </li>
            ${sortedTasks.map(
              ({ label, completed, id }) =>
                html`<li><task-item taskid="${id}" label="${label}" completed="${completed}"></task-item></li>`
            )}
            ${
              state.tasks.length > 0
                ? html`<li><task-footer></task-footer></li>`
                : ``
            }
          </ul>
      </main>
      `;
    });
    return {
      template$,
      css$: stream(`
        main {
          display: flex;
          flex-direction:column;
          align-items: center;
          font-family: Arial;
        }
        main ul {
          margin:0;
          padding:0;
          font-size: 18px;
          background: #fff;
          position: relative;
          box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 25px 50px 0 rgba(0, 0, 0, 0.1);
          width: 100%;
          min-width: 200px;
          max-width:500px;
          list-style:none;
        }
        main ul li {
          position: relative;
          z-index: 2;
          border-top: 1px solid #e6e6e6;
        }
        main ul:before {
          content: '';
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          height: 20px;
          overflow: hidden;
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2), 0 8px 0 -3px #f6f6f6, 0 9px 1px -3px rgba(0, 0, 0, 0.2), 0 16px 0 -6px #f6f6f6, 0 17px 2px -6px rgba(0, 0, 0, 0.2);
        }
        main h1 {
          font-size: 100px;
          font-weight: 100;
          text-align: center;
          color: rgba(175, 47, 47, 0.15);
          margin-bottom: 10px;
        }
      `)
    };
  }
);

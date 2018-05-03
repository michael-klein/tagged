import { html, EvaluatedTemplate, Sources, component } from "../../../src/";
import { Stream } from "../../tagged/src/types/types";
import * as flyd from "flyd";
import { addTask, state$, State, toggleAllChecked } from "../store";
const { stream, on } = flyd;
component(
  {
    name: "add-task"
  },
  (sources: Sources) => {
    const onInput$: Stream<Event> = stream();
    const inputValue$: Stream<string> = onInput$.map(
      (e: Event) => e.target["value"]
    );

    function onSubmit(e: KeyboardEvent) {
      if (e.keyCode === 13 && inputValue$().trim().length > 0) {
        addTask(inputValue$().trim());
        e.target["value"] = "";
      }
    }
    const template$: Stream<EvaluatedTemplate> = state$.map(state => {
      let buttonClasses: string[] = ["toggle-all"];
      if (state.tasks.length > 0) {
        buttonClasses.push("show");
      }
      if (state.tasks.filter(t => !t.completed).length === 0) {
        buttonClasses.push("checked");
      }
      return html`
      <div class="add">
        <button onclick="${toggleAllChecked}" class="${buttonClasses.join(
        " "
      )}"></button>
        <input placeholder="What needs to be done?" oninput="${onInput$}" onkeyup="${onSubmit}"/>
      </div>
      `;
    });
    return {
      template$,
      css$: stream(`
        button.toggle-all {
          position: absolute;
          cursor:pointer;
          top: 8px;
          left: -2px;
          width: 60px;
          height: 34px;
          text-align: center;
          border: none;
          -webkit-transform: rotate(90deg);
          transform: rotate(90deg);
          -webkit-appearance: none;
          appearance: none;
          background: none;
          display:none;
        }
        button.toggle-all.show {
          display:block;
        }
        button.toggle-all:before {
          content: '❯';
          font-size: 22px;
          color: #e6e6e6;
        }
        button.toggle-all.checked:before {
          color:#737373;
        }
        div.add {
          height: 50px;
        }
        input {
          font-size: 24px;
          font-family: Arial;
          line-height: 1.4em;
          width: 100%;
          height:100%;
          padding: 16px 16px 16px 50px;
          border: none;
          background: rgba(0, 0, 0, 0.003);
          box-shadow: inset 0 -2px 1px rgba(0,0,0,0.03);
        }
        input::-webkit-input-placeholder {
            font-style: italic;
            font-weight: 300;
            color: #e6e6e6;
        }
        input:focus, button:focus {
          outline: 0;
        }
      `)
    };
  }
);

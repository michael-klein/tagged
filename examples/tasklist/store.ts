import { Stream } from "../../src/types/types";
import * as flyd from "flyd";
const { stream, on } = flyd;
export interface Task {
  label: string;
  completed: boolean;
  id: string;
  timestamp: number;
}
export enum TaskFilter {
  ALL,
  COMPLETED,
  ACTIVE
}
interface State {
  tasks: Task[];
  taskFilter: TaskFilter;
}
const stateJSON: string = localStorage.getItem("state");
const initialState: State = stateJSON
  ? JSON.parse(stateJSON)
  : {
      tasks: [],
      taskFilter: TaskFilter.ALL
    };
export const state$: Stream<State> = stream(initialState);

export function addTask(label: string): void {
  const state: State = state$();
  state.tasks.push({
    label,
    completed: false,
    id: "task_" + Date.now(),
    timestamp: Date.now()
  });
  state$(state);
}

export function toggleChecked(idIn: string): void {
  const state: State = state$();
  state.tasks
    .filter(({ id }) => id === idIn)
    .forEach((task: Task) => (task.completed = !task.completed));
  state$(state);
}

export function setTaskFilter(filter: TaskFilter): void {
  const state: State = state$();
  state.taskFilter = filter;
  state$(state);
}

export function toggleAllChecked(): void {
  const state: State = state$();
  const shouldCheck: boolean =
    state.tasks.filter(task => !task.completed).length > 0;
  state.tasks.forEach((task: Task) => (task.completed = shouldCheck));
  state$(state);
}

export function removeTask(idIn: string): void {
  const state: State = state$();
  state.tasks = state.tasks.filter(({ id }) => id !== idIn);
  state$(state);
}

on(
  (state: State) => localStorage.setItem("state", JSON.stringify(state)),
  state$
);

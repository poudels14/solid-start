import { createMemo, createSignal, For, Show } from "solid-js";
import { useLocation, useRouteData } from "solid-start";
import { createServerAction, createServerData, redirect } from "solid-start/server";
import { CompleteIcon, IncompleteIcon } from "~/components/icons";
import db from "~/db";
import { Todo } from "~/types";

const setFocus = (el) => setTimeout(() => el.focus());

export const routeData = () =>
  createServerData(db.getTodos, { initialValue: [] });

const TodoApp = () => {
  const todos = useRouteData<typeof routeData>();
  const location = useLocation();

  const addTodo = createServerAction(async (form: FormData) => {
    await db.addTodo(form.get("title") as string);
    return redirect("/");
  });
  const toggleAll = createServerAction(async (form: FormData) => {
    await db.toggleAll(form.get("completed") === "true");
    return redirect("/");
  });
  const clearCompleted = createServerAction(async () => {
    await db.clearCompleted();
    return redirect("/");
  });
  const removeTodo = createServerAction(async (form: FormData) => {
    await db.removeTodo(Number(form.get("id")));
    return redirect("/");
  });
  const toggleTodo = createServerAction(async (form: FormData) => {
    await db.toggleTodo(Number(form.get("id")));
    return redirect("/");
  });
  const editTodo = createServerAction(async (form: FormData) => {
    await db.editTodo(Number(form.get("id")), String(form.get("title")));
    return redirect("/");
  });

  const [editingTodoId, setEditingId] = createSignal();
  const setEditing = ({id, pending}: {id?: number, pending?: () => boolean}) => {
    if (!pending || !pending()) setEditingId(id);
  }
  const remainingCount = createMemo(
    () => todos().length - todos().filter((todo) => todo.completed).length
  );
  const filterList = (todos: Todo[]) => {
    if (location.query.show === "active")
      return todos.filter((todo) => !todo.completed);
    else if (location.query.show === "completed")
      return todos.filter((todo) => todo.completed);
    else return todos;
  };

  let inputRef: HTMLInputElement;
  return (
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <addTodo.Form onSubmit={(e) => {
          if (!inputRef.value.trim()) e.preventDefault();
          setTimeout(() => inputRef.value = "")
        }}>
          <input
            name="title"
            class="new-todo"
            placeholder="What needs to be done?"
            ref={inputRef}
            autofocus
          />
        </addTodo.Form>
      </header>

      <section class="main">
      <Show when={todos().length > 0}>
          <toggleAll.Form>
            <input
              name="completed"
              type="hidden"
              value={String(!remainingCount())}
            />
            <button
              class={`toggle-all ${!remainingCount() ? "checked" : ""}`}
              type="submit"
            >
              ❯
            </button>
          </toggleAll.Form>
        </Show>
          <ul class="todo-list">
            <For each={filterList(todos())}>
              {(todo) => {
                const pending = () =>
                  toggleAll.state === "pending" ||
                  toggleTodo.pending.some((data) => +data.get("id") === todo.id) ||
                  editTodo.pending.some((data) => +data.get("id") === todo.id);
                const completed = () => {
                  let data = toggleAll.pending[toggleAll.pending.length]
                  if (data) return !data.get("completed");
                  data = toggleTodo.pending.find((data) => +data.get("id") === todo.id);
                  if (data) return !todo.completed;
                  return todo.completed;
                }
                const removing = () => removeTodo.pending.some((data) => +data.get("id") === todo.id);
                return <Show when={!removing()}>
                  <li
                    class="todo"
                    classList={{
                      editing: editingTodoId() === todo.id,
                      completed: completed(),
                      pending: pending()
                    }}
                  >
                    <div class="view">
                      <toggleTodo.Form>
                        <input type="hidden" name="id" value={todo.id} />
                        <button type="submit" class="toggle" disabled={pending()}>
                          {completed() ? <CompleteIcon /> : <IncompleteIcon />}
                        </button>
                      </toggleTodo.Form>
                      <label onDblClick={[setEditing, {id: todo.id, pending}]}>
                        {todo.title}
                      </label>
                      <removeTodo.Form>
                        <input type="hidden" name="id" value={todo.id} />
                        <button type="submit" class="destroy" />
                      </removeTodo.Form>
                    </div>
                    <Show when={editingTodoId() === todo.id}>
                      <editTodo.Form onSubmit={() => setEditing({})}>
                        <input type="hidden" name="id" value={todo.id} />
                        <input
                          name="title"
                          class="edit"
                          value={todo.title}
                          onBlur={(e) => {
                            if (todo.title !== e.currentTarget.value) {
                              e.currentTarget.form.requestSubmit();
                            } else setEditing({});
                          }}
                          use:setFocus
                        />
                      </editTodo.Form>
                    </Show>
                  </li>
                </Show>
              }}
            </For>
            <For each={addTodo.pending}>
              {(data) => (
                <li class="todo pending">
                  <div class="view">
                    <label>
                      {data.get("title") as string}
                    </label>
                    <button disabled class="destroy" />
                  </div>
                </li>
              )}
            </For>
          </ul>
        </section>

        <Show when={todos().length || addTodo.state === "pending"}>
        <footer class="footer">
          <span class="todo-count">
            <strong>{remainingCount()}</strong>{" "}
            {remainingCount() === 1 ? " item " : " items "} left
          </span>
          <ul class="filters">
            <li>
              <a href="?show=all" classList={{ selected: !location.query.show || location.query.show === "all" }}>
                All
              </a>
            </li>
            <li>
              <a href="?show=active" classList={{ selected: location.query.show === "active" }}>
                Active
              </a>
            </li>
            <li>
              <a href="?show=completed" classList={{ selected: location.query.show === "completed" }}>
                Completed
              </a>
            </li>
          </ul>
          <Show when={remainingCount() !== todos.length}>
            <clearCompleted.Form>
              <button class="clear-completed">Clear completed</button>
            </clearCompleted.Form>
          </Show>
        </footer>
      </Show>
    </section>
  );
};

export default TodoApp;

import React, {
  ChangeEvent,
  RefObject,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { postTodo, updateTodo, USER_ID } from '../../api/todos';
import { Todo } from '../../types/Todo';
import cn from 'classnames';

type Props = {
  elementFocus: RefObject<HTMLInputElement>;
  formText: string;
  todos: Todo[];
  errorMessage: string;
  setTodos: (todos: Todo[]) => void;
  setFormText: (formText: string) => void;
  setErrorMessage: (message: string) => void;
  setShowTempTodo: (todo: Todo | null) => void;
};

const creatingTodoId = (todos: Todo[]): number => {
  const todosId: number[] = todos.map(todo => todo.id);

  if (todos.length === 0) {
    return 1;
  }

  return Math.max(...todosId) + 1;
};

export const FormField: React.FC<Props> = ({
  elementFocus,
  formText,
  todos,
  errorMessage,
  setTodos,
  setErrorMessage,
  setFormText,
  setShowTempTodo,
}) => {
  const [diabled, setDisabled] = useState(false);
  const toggleButtonActive = useMemo(() => {
    return todos.every(todo => todo.completed);
  }, [todos]);

  useEffect(() => {
    if (elementFocus.current) {
      elementFocus.current.focus();
    }
  }, [diabled, elementFocus]);

  const addTodo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedText = formText.trim();

    if (!trimmedText) {
      setErrorMessage('Title should not be empty');

      if (!errorMessage) {
        setTimeout(() => {
          setErrorMessage('');
        }, 3000);
      }

      return;
    }

    const newTodo: Todo = {
      id: creatingTodoId(todos),
      title: trimmedText,
      completed: false,
      userId: USER_ID,
    };

    setShowTempTodo(newTodo);
    setDisabled(true);

    postTodo(newTodo)
      .then(responseTodo => {
        setDisabled(false);
        setShowTempTodo(null);
        setTodos([...todos, responseTodo]);
        setFormText('');
      })
      .catch(() => {
        setDisabled(false);
        setShowTempTodo(null);
        setErrorMessage('Unable to add a todo');

        if (!errorMessage) {
          setTimeout(() => {
            setErrorMessage('');
          }, 3000);
        }
      });
  };

  const toggleTodo = async (todo: Todo, state: boolean) => {
    try {
      const updated = { ...todo, completed: state };

      await updateTodo(updated);

      return updated;
    } catch {
      setErrorMessage('Unable to update a todo');

      return todo;
    }
  };

  const toggleAllTodos = async () => {
    const preparedTodos = [];

    if (toggleButtonActive) {
      for (const todo of todos) {
        preparedTodos.push(await toggleTodo(todo, false));
      }
    } else {
      for (const todo of todos) {
        if (!todo.completed) {
          preparedTodos.push(await toggleTodo(todo, true));
        } else {
          preparedTodos.push(todo);
        }
      }
    }

    setTodos(preparedTodos);
  };

  const changeHandle = (e: ChangeEvent<HTMLInputElement>) => {
    setFormText(e.target.value);
  };

  return (
    <header className="todoapp__header">
      {todos.length > 0 && (
        <button
          type="button"
          className={cn('todoapp__toggle-all', {
            active: toggleButtonActive,
          })}
          data-cy="ToggleAllButton"
          onClick={toggleAllTodos}
        />
      )}

      <form onSubmit={addTodo}>
        <input
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          ref={elementFocus}
          value={formText}
          disabled={diabled}
          onChange={changeHandle}
        />
      </form>

      {/* Add a todo on form submit */}
    </header>
  );
};

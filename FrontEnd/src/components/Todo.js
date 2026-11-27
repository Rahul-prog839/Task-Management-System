
import React, { useState, useEffect, useMemo } from "react";
import { AiFillDelete } from "react-icons/ai";
import { BiSearchAlt2 } from "react-icons/bi";
import { IoAdd, IoCheckmarkCircle } from "react-icons/io5";
import axios from "axios";
import Aos from "aos";
import "aos/dist/aos.css";
import "./styles/todo.css";

const Todo = ({ toast, todo, setTodo }) => {
  const [newItem, setNewItem] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  axios.defaults.withCredentials = true;

  const filteredItems = useMemo(() => {
    const items = Array.isArray(todo) ? todo : [];

    return items.filter((eachItem) =>
      (eachItem.title || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim())
    );
  }, [todo, searchQuery]);

  const completedCount = (Array.isArray(todo) ? todo : []).filter(
    (item) => item.status
  ).length;

  const pendingCount = (Array.isArray(todo) ? todo : []).length - completedCount;

  useEffect(() => {
    Aos.init({ duration: 700 });

    axios
      .get(`${process.env.REACT_APP_API_URL}/todo/getTodo`)
      .then((res) => {
        setTodo(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.log(err);
        toast.error("Unable to load reminders");
      });
  }, [setTodo, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const title = newItem.trim();

    if (!title) {
      toast.error("Please type something");
      return;
    }

    const newTodoItem = {
      todoId: crypto.randomUUID(),
      title,
      status: false,
    };

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/todo/postTodo`,
        newTodoItem
      );

      setTodo((current) => [...current, newTodoItem]);
      setNewItem("");
      toast.success("Reminder added successfully");
    } catch (err) {
      console.log(err);
      toast.error("Unable to add reminder");
    }
  };

  const tickTodo = async (todoId, status) => {
    const previousTodos = todo;

    setTodo((current) =>
      current.map((item) =>
        item.todoId === todoId ? { ...item, status } : item
      )
    );

    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/todo/updateTodo/${todoId}`,
        { status }
      );
    } catch (err) {
      console.log(err);
      setTodo(previousTodos);
      toast.error("Unable to update reminder");
    }
  };

  const deleteTodo = async (todoId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/todo/deleteTodo/${todoId}`
      );

      setTodo((current) =>
        current.filter((item) => item.todoId !== todoId)
      );

      toast.success("Reminder deleted");
    } catch (err) {
      console.log(err);
      toast.error("Unable to delete reminder");
    }
  };

  return (
    <div className="main-form" data-aos="fade-up">

      {/* PAGE HEADING */}

      <div className="todo-page-heading">
        <div>
          <span className="todo-eyebrow">STAY ORGANIZED</span>
          <h1>My Todos</h1>
          <p>Keep track of everyday activities and small reminders.</p>
        </div>

        <div className="todo-heading-icon">
          <IoCheckmarkCircle />
        </div>
      </div>

      {/* SUMMARY */}

      <div className="todo-summary">
        <div className="todo-summary-card">
          <span>Total reminders</span>
          <strong>{todo.length}</strong>
        </div>

        <div className="todo-summary-card completed-summary">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>

        <div className="todo-summary-card pending-summary">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>
      </div>

      {/* ADD REMINDER */}

      <form onSubmit={handleSubmit} className="todo-add-form">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          type="text"
          className="todo-ip"
          placeholder="What do you need to remember?"
          maxLength={150}
        />

        <button id="add-todo" type="submit">
          <IoAdd size={21} />
          <span>Add Reminder</span>
        </button>
      </form>

      {/* SEARCH AND LIST HEADING */}

      <div className="todo-list-heading">
        <div>
          <h2>Your reminders</h2>
          <p>Manage your daily activities</p>
        </div>

        <div className="todo-search">
          <BiSearchAlt2 size={19} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="search"
            placeholder="Search reminders..."
          />
        </div>
      </div>

      {/* REMINDER LIST */}

      <div className="item-list">
        {filteredItems.length === 0 ? (
          <div className="todo-empty-state">
            <div className="todo-empty-icon">
              <IoCheckmarkCircle />
            </div>

            <h3>
              {searchQuery ? "No matching reminders" : "No reminders yet"}
            </h3>

            <p>
              {searchQuery
                ? "Try searching with a different keyword."
                : "Add your first reminder and keep your day organized."}
            </p>
          </div>
        ) : (
          <div className="todo-grid">
            {filteredItems.map((item) => (
              <div
                className={`todo-card ${item.status ? "todo-completed" : ""}`}
                key={item.todoId}
              >
                <label className="todo-card-content">
                  <input
                    type="checkbox"
                    checked={Boolean(item.status)}
                    onChange={(e) =>
                      tickTodo(item.todoId, e.target.checked)
                    }
                  />

                  <span className="todo-custom-checkbox">
                    {item.status && <IoCheckmarkCircle />}
                  </span>

                  <span className="todo-card-title">
                    {item.title}
                  </span>
                </label>

                <div className="todo-card-actions">
                  <span className="todo-status">
                    {item.status ? "Completed" : "Pending"}
                  </span>

                  <button
                    type="button"
                    className="todo-delete-button"
                    onClick={() => deleteTodo(item.todoId)}
                    title="Delete reminder"
                    aria-label={`Delete ${item.title}`}
                  >
                    <AiFillDelete size={19} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Todo;

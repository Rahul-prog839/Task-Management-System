
import React, { useEffect, useState, useMemo } from "react";
import { AiFillDelete } from "react-icons/ai";
import { BiSearchAlt2 } from "react-icons/bi";
import "./styles/task.css";
import Aos from "aos";
import axios from "axios";
import "aos/dist/aos.css";

const Task = ({ toast, tasks, setTasks }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [completedTasks, setCompletedTasks] = useState([]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  );

  const [task, setTask] = useState({
    taskName: "",
    priority: "top",
    deadline: "",
    deadlineTime: "09:00",
    reminderMinutesBefore: "30",
  });

  axios.defaults.withCredentials = true;

  useEffect(() => {
    Aos.init({ duration: 1000 });

    axios
      .get(`${process.env.REACT_APP_API_URL}/task/getTask`)
      .then((res) => {
        const taskList = res.data || [];
        setTasks(taskList);
        setCompletedTasks(taskList.filter((obj) => obj.done));
      })
      .catch((err) => console.log("Unable to fetch tasks:", err));
  }, [setTasks]);

  function handleOnchange(e) {
    const { name, value } = e.target;

    setTask((previousTask) => ({
      ...previousTask,
      [name]: value,
    }));
  }

  // Enable browser notifications.
  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("Your browser does not support notifications");
      return;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        setNotificationsEnabled(true);
        toast.success("Browser notifications enabled");
      } else {
        setNotificationsEnabled(false);
        toast.error("Notification permission was not granted");
      }
    } catch (error) {
      console.error("Notification permission error:", error);
      toast.error("Unable to enable notifications");
    }
  };

  const addTask = async () => {
    if (task.taskName.trim() === "" || task.deadline === "") {
      toast.error("Please enter task and deadline");
      return;
    }

    if (!task.deadlineTime) {
      toast.error("Please select a deadline time");
      return;
    }

    const deadlineDateTime = new Date(
      `${task.deadline}T${task.deadlineTime}:00`
    );

    if (
      Number.isNaN(deadlineDateTime.getTime()) ||
      deadlineDateTime <= new Date()
    ) {
      toast.error("Please select a future deadline date and time");
      return;
    }

    const reminderMinutesBefore = Number(task.reminderMinutesBefore);

    const reminderAt =
      reminderMinutesBefore > 0
        ? new Date(
          deadlineDateTime.getTime() -
          reminderMinutesBefore * 60 * 1000
        ).toISOString()
        : null;

    const newTask = {
      id: crypto.randomUUID(),
      task: {
        taskName: task.taskName.trim(),
        priority: task.priority,
        deadline: task.deadline,
        deadlineTime: task.deadlineTime,
        reminderMinutesBefore,
        reminderAt,
      },
      done: false,
    };

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/task/postTask`,
        newTask
      );

      if (res.data.success) {
        setTasks(res.data.tasks);
        toast.success("Task added successfully");

        setTask({
          taskName: "",
          priority: "top",
          deadline: "",
          deadlineTime: "09:00",
          reminderMinutesBefore: "30",
        });
      }
    } catch (error) {
      console.error("Task saving failed:", error);
      toast.error("Unable to save task");
    }
  };

  const addToComplete = async (id) => {
    const updatedTasks = tasks.map((eachTask) =>
      eachTask.id === id
        ? { ...eachTask, done: true }
        : eachTask
    );

    setTasks(updatedTasks);
    setCompletedTasks(updatedTasks.filter((eachTask) => eachTask.done));

    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/task/updateTask/${id}`,
        { done: true }
      );
    } catch (err) {
      console.log("Unable to update task:", err);
      toast.error("Unable to mark task as completed");
    }
  };

  const removeTask = async (id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/task/deleteTask/${id}`
      );

      const updatedTasks = tasks.filter(
        (eachTask) => eachTask.id !== id
      );

      setTasks(updatedTasks);
      setCompletedTasks(updatedTasks.filter((eachTask) => eachTask.done));
      toast.success("Task deleted successfully");
    } catch (err) {
      console.log("Unable to delete task:", err);
      toast.error("Unable to delete task");
    }
  };

  // Check reminders every 30 seconds while this page is open.
  useEffect(() => {
    if (
      !notificationsEnabled ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    const checkReminders = () => {
      const now = new Date();

      tasks.forEach((eachTask) => {
        if (
          eachTask.done ||
          !eachTask.task ||
          !eachTask.task.reminderAt
        ) {
          return;
        }

        const reminderDate = new Date(eachTask.task.reminderAt);
        const deadlineDate = new Date(
          `${eachTask.task.deadline}T${eachTask.task.deadlineTime || "09:00"
          }:00`
        );

        if (
          Number.isNaN(reminderDate.getTime()) ||
          Number.isNaN(deadlineDate.getTime())
        ) {
          return;
        }

        const notificationKey = `task-reminder-${eachTask.id}`;

        if (
          now >= reminderDate &&
          now < deadlineDate &&
          !localStorage.getItem(notificationKey)
        ) {
          new Notification("Task Reminder", {
            body: `${eachTask.task.taskName} is due at ${eachTask.task.deadlineTime || "09:00"
              }.`,
            tag: notificationKey,
          });

          localStorage.setItem(notificationKey, "shown");
        }
      });
    };

    checkReminders();

    const reminderInterval = setInterval(checkReminders, 30000);

    return () => clearInterval(reminderInterval);
  }, [tasks, notificationsEnabled]);

  const upcomingTasks = tasks.filter((eachTask) => !eachTask.done);

  const comingFilteredItems = useMemo(() => {
    return upcomingTasks.filter((eachItem) =>
      eachItem.task.taskName
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [upcomingTasks, searchQuery]);

  const comingCompletedItems = useMemo(() => {
    return completedTasks.filter((eachItem) =>
      eachItem.task.taskName
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, completedTasks]);

  return (
    <div className="task-page" data-aos="zoom-in">

      {/* SEARCH BAR */}
      <header className="task-search-section">
        <h1>Tasks</h1>

        <div className="task-search-box">
          <BiSearchAlt2 size={22} />

          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="search"
            placeholder="Search your tasks..."
            aria-label="Search tasks"
          />

          <button type="button" aria-label="Search">
            <BiSearchAlt2 size={20} />
          </button>
        </div>
      </header>

      {/* ADD TASK FORM */}
      <div className="add-div">
        <input
          type="text"
          placeholder="Enter task"
          name="taskName"
          value={task.taskName}
          onChange={handleOnchange}
        />

        <select
          name="priority"
          value={task.priority}
          onChange={handleOnchange}
        >
          <option value="top">Top priority</option>
          <option value="average">Average priority</option>
          <option value="low">Low priority</option>
        </select>

        <input
          type="date"
          name="deadline"
          value={task.deadline}
          onChange={handleOnchange}
        />

        <input
          type="time"
          name="deadlineTime"
          value={task.deadlineTime}
          onChange={handleOnchange}
          title="Deadline time"
        />

        <select
          name="reminderMinutesBefore"
          value={task.reminderMinutesBefore}
          onChange={handleOnchange}
          title="Select when you want to be reminded"
        >
          <option value="0">No reminder</option>
          <option value="10">10 minutes before</option>
          <option value="30">30 minutes before</option>
          <option value="60">1 hour before</option>
          <option value="1440">1 day before</option>
        </select>

        <button id="add-bt" type="button" onClick={addTask}>
          Add Task
        </button>

        <button
          type="button"
          className="notification-toggle"
          onClick={enableNotifications}
          title="Allow browser notifications"
        >
          {notificationsEnabled
            ? "Notifications Enabled"
            : "Enable Notifications"}
        </button>
      </div>

      {/* TASK TABLES */}
      <main className="task-body" data-aos="zoom-out">
        <h3>Current Tasks</h3>

        <div className="cur-task-list" data-aos="zoom-in">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Priority</th>
                <th>Deadline</th>
                <th>Time</th>
                <th>Reminder</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {comingFilteredItems.map((eachTask) => (
                <tr key={eachTask.id}>
                  <td>{eachTask.task.taskName}</td>
                  <td>{eachTask.task.priority}</td>
                  <td>{eachTask.task.deadline}</td>
                  <td>{eachTask.task.deadlineTime || "09:00"}</td>

                  <td>
                    {eachTask.task.reminderMinutesBefore === 0
                      ? "None"
                      : eachTask.task.reminderMinutesBefore
                        ? eachTask.task.reminderMinutesBefore === 1440
                          ? "1 day before"
                          : eachTask.task.reminderMinutesBefore === 60
                            ? "1 hour before"
                            : `${eachTask.task.reminderMinutesBefore} minutes before`
                        : "Not set"}
                  </td>

                  <td>
                    {!eachTask.done && (
                      <button
                        id="done-bt"
                        onClick={() => addToComplete(eachTask.id)}
                      >
                        Done
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {comingFilteredItems.length === 0 && (
                <tr>
                  <td colSpan="6">No current tasks found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h3>Completed Tasks</h3>

        <div className="completed-task" data-aos="zoom-in">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Priority</th>
                <th>Deadline</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {comingCompletedItems.map((eachTask) => (
                <tr key={eachTask.id}>
                  <td>{eachTask.task.taskName}</td>
                  <td>{eachTask.task.priority}</td>
                  <td>{eachTask.task.deadline}</td>
                  <td>{eachTask.task.deadlineTime || "09:00"}</td>

                  <td>
                    <button
                      id="task-remove"
                      onClick={() => removeTask(eachTask.id)}
                    >
                      <AiFillDelete size={20} color="#FF6969" />
                    </button>
                  </td>
                </tr>
              ))}

              {comingCompletedItems.length === 0 && (
                <tr>
                  <td colSpan="5">No completed tasks found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Task;

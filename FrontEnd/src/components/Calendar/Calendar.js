
import React, { useEffect, useState } from "react";
import axios from "axios";

import Badge from "@mui/material/Badge";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";

import { format } from "date-fns";
import "./Calendar.css";

const TaskDay = (props) => {
  const {
    day,
    outsideCurrentMonth,
    tasksByDate = {},
    ...other
  } = props;

  const dateKey = format(day, "yyyy-MM-dd");
  const dayTasks = tasksByDate[dateKey] || [];

  return (
    <Badge
      overlap="circular"
      badgeContent={
        dayTasks.length > 0 ? (
          <span className="calendar-task-count">
            {dayTasks.length}
          </span>
        ) : undefined
      }
    >
      <PickersDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
      />
    </Badge>
  );
};

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/task/getTask`,
          { withCredentials: true }
        );

        setTasks(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Calendar task error:", err);
        setError("Unable to load tasks.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const tasksByDate = {};

  tasks.forEach((task) => {
    const deadline = task.task?.deadline;

    if (!deadline) return;

    if (!tasksByDate[deadline]) {
      tasksByDate[deadline] = [];
    }

    tasksByDate[deadline].push(task);
  });

  
  const selectedDateKey = format(
    selectedDate,
    "yyyy-MM-dd"
  );

  const selectedTasks = tasksByDate[selectedDateKey] || [];

  const todayKey = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="calendar-container">

      {/* CALENDAR HEADER */}
      <div className="calendar-heading">
        <h2>Task Calendar</h2>
        <p>View and manage your tasks by deadline</p>
      </div>

      {/* CALENDAR */}
      <div className="calendar-picker">

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <StaticDatePicker
            value={selectedDate}
            onChange={(newValue) => {
              if (newValue && !isNaN(newValue.getTime())) {
                setSelectedDate(newValue);
              }
            }}
            slots={{
              day: TaskDay
            }}
            slotProps={{
              day: {
                tasksByDate
              }
            }}
          />
        </LocalizationProvider>

      </div>

      {/* SELECTED DATE TASKS */}
      <div className="calendar-task-section">

        <div className="calendar-task-header">
          <div>
            <h3>
              {format(selectedDate, "EEEE, dd MMMM yyyy")}
            </h3>
            <p>
              {selectedDateKey === todayKey
                ? "Today's schedule"
                : "Tasks scheduled for this date"}
            </p>
          </div>

          <span className="calendar-task-total">
            {selectedTasks.length} Tasks
          </span>
        </div>

        {loading ? (
          <p className="calendar-empty">
            Loading tasks...
          </p>
        ) : error ? (
          <p className="calendar-error">
            {error}
          </p>
        ) : selectedTasks.length === 0 ? (
          <p className="calendar-empty">
            No tasks scheduled for this date.
          </p>
        ) : (
          <div className="calendar-task-list">

            {selectedTasks.map((task) => {

              const isCompleted = task.done === true;

              return (
                <div
                  className={`calendar-task-item ${isCompleted ? "calendar-completed" : ""
                    }`}
                  key={task.id}
                >

                  <div className="calendar-task-details">

                    <h4>
                      {task.task?.taskName || "Untitled Task"}
                    </h4>

                    <p>
                      Priority:{" "}
                      {task.task?.priority || "Not set"}
                    </p>

                    <p>
                      Deadline: {task.task?.deadline}
                    </p>

                  </div>

                  <span
                    className={`calendar-task-status ${isCompleted ? "status-completed" : "status-pending"
                      }`}
                  >
                    {isCompleted ? "Completed" : "Pending"}
                  </span>

                </div>
              );
            })}

          </div>
        )}

      </div>

      {/* CALENDAR LEGEND */}
      <div className="calendar-legend">
        <span>
          <i className="legend-dot"></i>
          Days with tasks
        </span>

        <span>
          <i className="legend-today"></i>
          Today
        </span>
      </div>

    </div>
  );
};

export default Calendar;

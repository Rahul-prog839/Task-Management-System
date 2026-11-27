
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiFileText,
  FiCheckSquare,
  FiTarget,
  FiArrowUpRight
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import "./Dashboard.css";

const Dashboard = ({ notes, tasks, todo }) => {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError("");

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/task/analytics`,
          { withCredentials: true }
        );

        if (response.data.success) {
          setAnalytics(response.data);
        } else {
          setAnalyticsError("Unable to load analytics.");
        }
      } catch (error) {
        console.error("Analytics Error:", error);
        setAnalyticsError("Unable to load analytics. Please try again.");
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [tasks]);

  useEffect(() => {
    const container = document.querySelector(".home-body-conatiner");

    if (!container) return;

    if (!("IntersectionObserver" in window)) {
      container
        .querySelectorAll(".scroll-reveal")
        .forEach((element) => element.classList.add("scroll-visible"));

      return;
    }

    const elements = container.querySelectorAll(
      ".quick-access-card, .dashboard-analytics, .completion-section, .analytics-chart-box, .deadline-section, .deadline-group"
    );

    elements.forEach((element) => {
      element.classList.add("scroll-reveal");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("scroll-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: container,
        threshold: 0.08,
        rootMargin: "0px 0px -25px 0px"
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [analytics, analyticsLoading]);

  const noteCount = Array.isArray(notes) ? notes.length : 0;
  const todoCount = Array.isArray(todo) ? todo.length : 0;
  const taskCount = Array.isArray(tasks) ? tasks.length : 0;

  const quickAccessItems = [
    {
      title: "My Notes",
      description: "Capture ideas, thoughts and important information.",
      count: noteCount,
      label: "Notes saved",
      icon: <FiFileText />,
      className: "quick-notes",
      action: () => navigate("/Home/notes")
    },
    {
      title: "My Todos",
      description: "Keep track of everyday activities and small tasks.",
      count: todoCount,
      label: "Todo items",
      icon: <FiCheckSquare />,
      className: "quick-todos",
      action: () => navigate("/Home/todos")
    },
    {
      title: "My Tasks",
      description: "Organize priorities and stay ahead of deadlines.",
      count: taskCount,
      label: "Tasks created",
      icon: <FiTarget />,
      className: "quick-tasks",
      action: () => navigate("/Home/task")
    }
  ];

 
  const statusData = analytics
    ? [
      { name: "Completed", value: analytics.completedTasks },
      { name: "Pending", value: analytics.pendingTasks }
    ]
    : [];

  const priorityData = analytics
    ? [
      { name: "Top", value: analytics.priorityStats.top },
      { name: "Average", value: analytics.priorityStats.average },
      { name: "Low", value: analytics.priorityStats.low }
    ]
    : [];

  const weeklyProductivityData = analytics?.weeklyProductivity || [];
  const overdueList = analytics?.overdueList || [];
  const dueToday = analytics?.dueToday || [];
  const dueTomorrow = analytics?.dueTomorrow || [];
  const upcomingTasks = analytics?.upcomingTasks || [];

  const statusColors = ["#16A085", "#F4A340"];
  const priorityColors = ["#E76F75", "#F4A340", "#16A085"];

  const renderDeadlineTasks = (taskList) => {
    if (!taskList || taskList.length === 0) {
      return (
        <p className="deadline-empty">
          No tasks in this category.
        </p>
      );
    }

    return taskList.map((task) => (
      <div className="deadline-task" key={task.id}>
        <div className="deadline-task-info">
          <strong>{task.title || "Untitled Task"}</strong>
          <p>Deadline: {task.deadline}</p>
        </div>

        <span className="deadline-priority">
          {task.priority || "Not set"}
        </span>
      </div>
    ));
  };

  return (
    <div className="home-body-conatiner">

      {/* DASHBOARD HEADER */}
      <header id="dash-header" className="search-bar">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">
            Your personal space to plan, organize and get things done.
          </p>
        </div>
      </header>

      {/* QUICK ACCESS */}
      <section className="quick-access-section">
        <div className="section-title-row">
          <div>
            <h2>Quick Access</h2>
            <p>Pick up right where you left off.</p>
          </div>
        </div>

        <div className="quick-access-grid">
          {quickAccessItems.map((item) => (
            <button
              type="button"
              className={`quick-access-card ${item.className}`}
              key={item.title}
              onClick={item.action}
            >
              <div className="quick-card-top">
                <span className="quick-card-icon">{item.icon}</span>
                <FiArrowUpRight className="quick-card-arrow" />
              </div>

              <div className="quick-card-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>

              <div className="quick-card-bottom">
                <strong>{item.count}</strong>
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* TASK ANALYTICS */}
      <section className="dashboard-analytics">
        <div className="analytics-heading">
          <h2>Task Analytics</h2>
          <p>Understand your progress and keep moving forward.</p>
        </div>

        {analyticsLoading ? (
          <p className="analytics-message">Loading analytics...</p>
        ) : analyticsError ? (
          <p className="analytics-message analytics-error">
            {analyticsError}
          </p>
        ) : analytics ? (
          <>
            {/* SUMMARY CARDS */}
            <div className="analytics-cards">
              <div className="analytics-card total-card">
                <span>Total Tasks</span>
                <h2>{analytics.totalTasks}</h2>
              </div>

              <div className="analytics-card completed-card">
                <span>Completed</span>
                <h2>{analytics.completedTasks}</h2>
              </div>

              <div className="analytics-card pending-card">
                <span>Pending</span>
                <h2>{analytics.pendingTasks}</h2>
              </div>

              <div className="analytics-card overdue-card">
                <span>Overdue</span>
                <h2>{analytics.overdueTasks}</h2>
              </div>
            </div>

            {/* TASK COMPLETION */}
            <div className="completion-section">
              <div className="completion-info">
                <h3>Task Completion</h3>
                <strong>{analytics.completionRate}%</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${analytics.completionRate}%`
                  }}
                />
              </div>
            </div>

            {/* CHARTS */}
            <div className="analytics-charts">

              {/* TASK STATUS */}
              <div className="analytics-chart-box">
                <h3>Task Status</h3>

                {analytics.totalTasks === 0 ? (
                  <p className="no-chart-data">
                    No tasks available yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={statusData}
                      margin={{
                        top: 20,
                        right: 20,
                        left: 0,
                        bottom: 10
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        allowDecimals={false}
                        domain={[0, "auto"]}
                      />
                      <Tooltip />

                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {statusData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={statusColors[index]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* TASK PRIORITY */}
              <div className="analytics-chart-box">
                <h3>Tasks by Priority</h3>

                {priorityData.every((item) => item.value === 0) ? (
                  <p className="no-chart-data">
                    No priority data available yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={priorityData}
                      margin={{
                        top: 20,
                        right: 20,
                        left: 0,
                        bottom: 10
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        allowDecimals={false}
                        domain={[0, "auto"]}
                      />
                      <Tooltip />

                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {priorityData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={priorityColors[index]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* WEEKLY PRODUCTIVITY */}
              <div className="analytics-chart-box weekly-chart-box">
                <h3>Weekly Productivity</h3>

                <p className="weekly-chart-description">
                  Tasks completed during the last 7 days
                </p>

                {weeklyProductivityData.length === 0 ? (
                  <p className="no-chart-data">
                    No weekly productivity data available yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={weeklyProductivityData}
                      margin={{
                        top: 20,
                        right: 20,
                        left: 0,
                        bottom: 10
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis
                        allowDecimals={false}
                        domain={[0, "auto"]}
                      />

                      <Tooltip
                        formatter={(value) => [
                          value,
                          "Tasks completed"
                        ]}
                        labelFormatter={(label) => `Day: ${label}`}
                      />

                      <Bar
                        dataKey="completed"
                        name="Completed Tasks"
                        fill="#6574CD"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* UPCOMING DEADLINES */}
            <div className="deadline-section">
              <div className="analytics-heading">
                <h2>Upcoming Deadlines</h2>
                <p>
                  Stay on top of your tasks and never miss a deadline.
                </p>
              </div>

              <div className="deadline-grid">

                <div className="deadline-group overdue-group">
                  <div className="deadline-group-heading">
                    <h3>Overdue</h3>
                    <span>{overdueList.length}</span>
                  </div>
                  {renderDeadlineTasks(overdueList)}
                </div>

                <div className="deadline-group today-group">
                  <div className="deadline-group-heading">
                    <h3>Due Today</h3>
                    <span>{dueToday.length}</span>
                  </div>
                  {renderDeadlineTasks(dueToday)}
                </div>

                <div className="deadline-group tomorrow-group">
                  <div className="deadline-group-heading">
                    <h3>Due Tomorrow</h3>
                    <span>{dueTomorrow.length}</span>
                  </div>
                  {renderDeadlineTasks(dueTomorrow)}
                </div>

                <div className="deadline-group upcoming-group">
                  <div className="deadline-group-heading">
                    <h3>Next 7 Days</h3>
                    <span>{upcomingTasks.length}</span>
                  </div>
                  {renderDeadlineTasks(upcomingTasks)}
                </div>

              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
};

export default Dashboard;


import React, { useEffect, useState } from "react";
import DarkMode from "./DarkMode/Darkmode";
import Notification from "./Notification/Notification";
import { IoMdNotifications } from "react-icons/io";
import { FiTrendingUp, FiCheckCircle, FiClock } from "react-icons/fi";
import Calendar from "./Calendar/Calendar";
import axios from "axios";
import Aos from "aos";
import "aos/dist/aos.css";

const Profile = ({ tasks = [] }) => {
  const [user, setUser] = useState(null);
  const [profileImageError, setProfileImageError] = useState(false);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [dialog, setDialog] = useState({ isLoading: false });

  useEffect(() => {
    Aos.init({ duration: 1000 });

    axios
      .get(`${process.env.REACT_APP_API_URL}/getUser`, {
        withCredentials: true,
      })
      .then((res) => {
        setUser(res.data);
        setProfileImageError(false);
      })
      .catch((err) => console.error("User fetch error:", err));
  }, []);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/task/getTask`, {
        withCredentials: true,
      })
      .then((res) => {
        const today = new Date().toISOString().split("T")[0];

        const todayTasks = res.data.filter(
          (obj) => obj.done === false && obj.task?.deadline === today
        );

        setUpcomingTasks(todayTasks);
      })
      .catch((err) =>
        console.error("Notification tasks error:", err)
      );
  }, [tasks]);

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const completedToday = safeTasks.filter((task) => {
    if (!task.done || !task.completedAt) return false;

    return (
      new Date(task.completedAt).toDateString() ===
      new Date().toDateString()
    );
  }).length;

  const pendingTasks = safeTasks.filter((task) => !task.done).length;

  const nextTask = safeTasks
    .filter(
      (task) =>
        !task.done &&
        task.task?.deadline &&
        new Date(
          `${task.task.deadline}T${task.task.deadlineTime || "23:59"}`
        ) >= new Date()
    )
    .sort((a, b) => {
      const dateA = new Date(
        `${a.task.deadline}T${a.task.deadlineTime || "23:59"}`
      );
      const dateB = new Date(
        `${b.task.deadline}T${b.task.deadlineTime || "23:59"}`
      );

      return dateA - dateB;
    })[0];

  const openNotifi = () => setDialog({ isLoading: true });
  const closeNotifi = () => setDialog({ isLoading: false });

  return (
    <div className="profile" data-aos="fade-left">
      <div className="profile-div">
        <DarkMode />

        <button
          className={upcomingTasks.length ? "bell" : ""}
          onClick={openNotifi}
          aria-label="Open notifications"
          title="Notifications"
        >
          <span id="noti-count">{upcomingTasks.length}</span>
          <IoMdNotifications size={25} color="#6574CD" />
        </button>

        {user?.picUrl && !profileImageError && (
          <img
            title={user.userName || "Profile"}
            id="prof-img"
            src={user.picUrl}
            alt="Google profile avatar"
            referrerPolicy="no-referrer"
            onError={() => setProfileImageError(true)}
          />
        )}
      </div>

      {dialog.isLoading && (
        <Notification
          closeNotifi={closeNotifi}
          upcomingTasks={upcomingTasks}
        />
      )}

      <Calendar />

      <section className="productivity-insights" data-aos="zoom-in">
        <div className="insights-heading">
          <div>
            <span className="insights-eyebrow">YOUR PROGRESS</span>
            <h3>Productivity Insights</h3>
            <p>A quick look at how your day is going.</p>
          </div>

          <span className="insights-heading-icon">
            <FiTrendingUp />
          </span>
        </div>

        <div className="insight-stat">
          <span className="insight-icon completed-insight">
            <FiCheckCircle />
          </span>
          <div>
            <strong>{completedToday}</strong>
            <p>Tasks completed today</p>
          </div>
        </div>

        <div className="insight-stat">
          <span className="insight-icon pending-insight">
            <FiClock />
          </span>
          <div>
            <strong>{pendingTasks}</strong>
            <p>Tasks still pending</p>
          </div>
        </div>

        <div className="next-deadline-insight">
          <span>UP NEXT</span>

          {nextTask ? (
            <>
              <h4>{nextTask.task?.taskName || "Untitled task"}</h4>
              <p>
                Due {nextTask.task.deadline}
                {nextTask.task.deadlineTime
                  ? ` at ${nextTask.task.deadlineTime}`
                  : ""}
              </p>
            </>
          ) : (
            <p>No upcoming pending deadlines. You're all caught up!</p>
          )}
        </div>

        <p className="insights-tip">
          {pendingTasks > 0
            ? "Tip: Focus on your highest-priority task first."
            : "Great work! Keep the momentum going."}
        </p>
      </section>
    </div>
  );
};

export default Profile;

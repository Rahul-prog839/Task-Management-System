
import React, { useEffect } from "react";
import { LuListTodo } from "react-icons/lu";
import { IoCalendarNumber } from "react-icons/io5";
import { FaRegNoteSticky } from "react-icons/fa6";
import axios from "axios";
import { BiLogOut, BiSolidDashboard } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import icon from "../utils/icon.PNG";
import Aos from "aos";
import "aos/dist/aos.css";

const Navbar = () => {
  const navigate = useNavigate();

  useEffect(() => {
    Aos.init({ duration: 800 });
  }, []);

  const openTodo = () => navigate("/Home/todos");
  const openTask = () => navigate("/Home/task");
  const openNotes = () => navigate("/Home/notes");
  const goToDashboard = () => navigate("/Home");

  const logOut = () => {
    axios.get(`${process.env.REACT_APP_API_URL}/logout`, {
      withCredentials: true,
    })
      .then(() => navigate("/"))
      .catch((err) => console.log(err));
  };

  return (
    <nav className="nav-left" data-aos="fade-right">
      <button className="todo-theme" type="button">
        <img src={icon} alt="Task Manager" />
      </button>

      <button onClick={goToDashboard} className="nav-icon skull" title="Dashboard">
        <BiSolidDashboard size={22} />
      </button>

      <button onClick={openTodo} className="nav-icon skull" title="Todos">
        <LuListTodo size={20} />
      </button>

      <button onClick={openTask} className="nav-icon skull" title="Tasks">
        <IoCalendarNumber size={20} />
      </button>

      <button onClick={openNotes} className="nav-icon skull" title="Notes">
        <FaRegNoteSticky size={20} />
      </button>

      <button onClick={logOut} className="nav-icon skull" title="Logout">
        <BiLogOut size={22} />
      </button>
    </nav>
  );
};

export default Navbar;

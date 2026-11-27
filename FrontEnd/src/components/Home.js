
import React, { useState, useEffect } from "react";
import BeatLoader from "react-spinners/BeatLoader";
import "./styles/Home.css";
import Navbar from "./Navbar";
import Profile from "./Profile";
import { Outlet } from "react-router-dom";
import Aos from "aos";
import "aos/dist/aos.css";

const Home = ({ tasks }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    Aos.init({
      duration: 800,
      once: true,
      offset: 80,
      easing: "ease-out-cubic",
      mirror: false,
      anchorPlacement: "top-bottom"
    });
  }, []);

  return (
    <>
      {loading ? (
        <div className="home-loader">
          <BeatLoader
            color="#6574CD"
            loading={loading}
            size={18}
            aria-label="Loading Spinner"
          />
        </div>
      ) : (
        <div className="main-home-container">
          <Navbar />

          <Outlet />

          <Profile tasks={tasks} />
        </div>
      )}
    </>
  );
};

export default Home;


import React, { useState } from "react";
import "../App.css";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Mainpage({ toast, signIn, user }) {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [users, setUsers] = useState({
    userName: "",
    email: "",
    password: "",
  });
  const [userLogin, setUserLogin] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const googleAuth = () => {
    window.open(
      `${process.env.REACT_APP_API_URL}/google`,
      "_self"
    );
  };

  const githubAuth = () => {
    window.open(
      `${process.env.REACT_APP_API_URL}/github`,
      "_self"
    );
  };

  const openForgotPass = () => {
    navigate("/forgotpass");
  };

  function handleOnchange(e) {
    setUsers({
      ...users,
      [e.target.name]: e.target.value,
    });
  }

  function handleUserLogin(e) {
    setUserLogin({
      ...userLogin,
      [e.target.name]: e.target.value,
    });
  }

  axios.defaults.withCredentials = true;

  const handleLogin = (e) => {
    e.preventDefault();

    if (!userLogin.email || !userLogin.password) {
      toast.error("Enter the details");
      return;
    }

    axios
      .post(
        `${process.env.REACT_APP_API_URL}/login`,
        userLogin,
        { withCredentials: true }
      )
      .then((result) => {
        if (result.data.success) {
          toast.success("Login successfully");
          setUserLogin({ email: "", password: "" });
          navigate("/Home");
        }
      })
      .catch((err) => {
        toast.error(
          err.response?.data?.message || "Login failed"
        );
      });
  };

  const handleRegister = (e) => {
    e.preventDefault();

    axios
      .post(
        `${process.env.REACT_APP_API_URL}/register`,
        users
      )
      .then((result) => {
        console.log(result);

        if (result.data !== "Already Registerd") {
          toast.success("Registered Successfully..");
          setUsers({
            userName: "",
            email: "",
            password: "",
          });
          signIn();
        } else {
          toast.error(result.data);
          setUsers({
            userName: "",
            email: "",
            password: "",
          });
          signIn();
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <>
      {/* Sign Up Section */}
      <div className="form-container sign-up">
        <form
          method="POST"
          action="/"
          onSubmit={(e) => handleRegister(e)}
        >
          <h1>Create Account</h1>

          <div className="social-icons">
            <button
              type="button"
              onClick={googleAuth}
              className="icon"
            >
              <FcGoogle size={22} />
            </button>

            <button
              type="button"
              onClick={githubAuth}
              className="icon"
            >
              <FaGithub size={22} />
            </button>
          </div>

          <span>or use your email for registration</span>

          <input
            type="text"
            placeholder="Username"
            id="userName"
            name="userName"
            value={users.userName}
            onChange={handleOnchange}
          />

          <input
            type="email"
            placeholder="Email"
            id="email"
            name="email"
            value={users.email}
            onChange={handleOnchange}
          />

          <input
            type="password"
            placeholder="Password"
            id="password"
            name="password"
            value={users.password}
            onChange={handleOnchange}
          />

          <button className="bt" type="submit">
            Sign Up
          </button>
        </form>
      </div>

      {/* Sign In Section */}
      <div className="form-container sign-in">
        <form
          method="POST"
          action="/"
          onSubmit={(e) => handleLogin(e)}
        >
          <h1>Sign In</h1>

          <div className="social-icons">
            <button
              type="button"
              onClick={googleAuth}
              className="icon"
            >
              <FcGoogle size={22} />
            </button>

            <button
              type="button"
              onClick={githubAuth}
              className="icon"
            >
              <FaGithub size={22} />
            </button>
          </div>

          <span>or use your email and password</span>

          <input
            type="email"
            name="email"
            value={userLogin.email}
            onChange={handleUserLogin}
            placeholder="Email"
          />

          <input
            type="password"
            name="password"
            value={userLogin.password}
            onChange={handleUserLogin}
            placeholder="Password"
          />

          <a
            href="/forgotpass"
            onClick={(e) => {
              e.preventDefault();
              openForgotPass();
            }}
          >
            Forgot your password?
          </a>

          <button className="bt" type="submit">
            Sign In
          </button>
        </form>
      </div>
    </>
  );
}


import React, { useState } from "react";
import "./styles/forgotpass.css";
import axios from "axios";

const ForgotPass = ({ toast }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  axios.defaults.withCredentials = true;

  const getNewPassLink = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/forgotpass`,
        { email }
      );

      if (res.data.Status === "success") {
        setEmailSent(true);
        toast.success("Reset link sent successfully!");
      } else {
        toast.error("Enter a registered email");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Unable to send reset link. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-con">
      {emailSent ? (
        <div className="email-success">
          <h2>Check Your Email! ✉️</h2>
          <p>We've sent a password reset link to:</p>
          <strong>{email}</strong>
          <p>Please check your inbox and spam folder.</p>
        </div>
      ) : (
        <form onSubmit={getNewPassLink}>
          <h3>Forgot Your Password?</h3>
          <h3>Just relax!</h3>

          <label htmlFor="email">
            Enter your registered email
          </label>

          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPass;

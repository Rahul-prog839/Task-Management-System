
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();
require("./passport");

const express = require("express");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const authModel = require("./Models/Model");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const TodoRoutes = require("./Routes/TodoRoutes");
const NoteRoutes = require("./Routes/NoteRoutes");
const TaskRoutes = require("./Routes/TaskRoutes");

const PORT = process.env.PORT || 8080;

const app = express();
app.set("trust proxy", 1);

app.use([
  cors({
    origin: process.env.FRONTEND_DOMAIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }),
  express.json(),
  express.urlencoded({ extended: true }),
]);

const sessionStore = new MongoStore({
  mongoUrl: process.env.MONGO_URL,
  collectionName: "session",
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.json("hello");
});

app.post("/register", async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await authModel.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAuth = new authModel({
      userName: userName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const savedUser = await newAuth.save();

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        userName: savedUser.userName,
        email: savedUser.email,
      },
    });
  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to register. Please try again.",
    });
  }
});

app.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.FRONTEND_DOMAIN,
    successRedirect: `${process.env.FRONTEND_DOMAIN}/Home`,
  })
);

app.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
  })
);

app.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: process.env.FRONTEND_DOMAIN,
    successRedirect: `${process.env.FRONTEND_DOMAIN}/Home`,
  })
);

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || "Invalid email or password",
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }

      return res.json({
        success: true,
        message: "Successfully logged in",
      });
    });
  })(req, res, next);
});

app.get("/logout", (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        return next(sessionError);
      }

      res.clearCookie("connect.sid");

      return res.json({
        success: true,
        message: "Successfully logged out",
      });
    });
  });
});

app.get("/getUser", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: "Login Required",
    });
  }

  return res.json({
    userName: req.user.userName,
    email: req.user.email,
    picUrl: req.user.picUrl || null,
  });
});

app.post("/resetPassword/:id/:token", async (req, res) => {
  try {
    const { id, token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        Status: "Password must be at least 6 characters",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (decoded.id !== id) {
      return res.status(401).json({
        Status: "Invalid reset link",
      });
    }

    const user = await authModel.findById(id);

    if (!user) {
      return res.status(404).json({
        Status: "User not found",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return res.json({
      Status: "success",
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("Reset Password Error:", err);

    return res.status(400).json({
      Status: "Invalid or expired reset link",
    });
  }
});

app.post("/forgotpass", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        Status: "Please enter your email",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await authModel.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        Status: "Enter a valid email",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: "Forgot password for Task Management System",
      text: `${process.env.FRONTEND_DOMAIN}/ResetPass/${user._id}/${token}`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      Status: "success",
      message: "Password reset link sent successfully",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      Status: "error",
      message: "Unable to send reset email. Please try again.",
    });
  }
});

const authenticator = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: "Login Required",
    });
  }

  next();
};

app.use("/todo", authenticator, TodoRoutes);
app.use("/note", authenticator, NoteRoutes);
app.use("/task", authenticator, TaskRoutes);

app.listen(PORT, () => {
  console.log(`Server Running On Port: ${PORT}`);
});

module.exports = app;

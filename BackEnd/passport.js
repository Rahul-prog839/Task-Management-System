
const passport = require("passport");
require("dotenv").config();

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const LocalStrategy = require("passport-local").Strategy;

const authModel = require("./Models/Model");
const bcrypt = require("bcrypt");

const googleCredentials = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://task-management-system-yibk.onrender.com/google/callback",
};

const githubCredentials = {
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "http://localhost:8080/github/callback",
  scope: ["user:email"],
};

const callback = async (accessToken, refreshToken, profile, cb) => {
  try {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    const googlePicture = profile.photos?.[0]?.value || "";

    if (!email) {
      return cb(new Error("Google email is unavailable"));
    }

    const newUser = {
      userName: profile.displayName || "Google User",
      email,
      googleId: profile.id,
      picUrl: googlePicture,
    };

    let user = await authModel.findOne({
      googleId: profile.id,
    });

    if (user) {
      user.userName = newUser.userName;

      if (googlePicture) {
        user.picUrl = googlePicture;
      }

      await user.save();
      return cb(null, user);
    }

    const emailVerified = profile.emails?.[0]?.verified === true;

    if (emailVerified) {
      user = await authModel.findOne({ email });

      if (user) {
        user.googleId = profile.id;

        if (googlePicture) {
          user.picUrl = googlePicture;
        }

        await user.save();
        return cb(null, user);
      }
    }

    const savedUser = await authModel(newUser).save();
    return cb(null, savedUser);
  } catch (err) {
    return cb(err);
  }
};

const githubCallback = async (
  accessToken,
  refreshToken,
  profile,
  cb
) => {
  try {
    const email = profile.emails?.[0]?.value?.toLowerCase();

    if (!email) {
      return cb(new Error("GitHub email is unavailable"));
    }

    const githubPicture = profile.photos?.[0]?.value || "";

    const newUser = {
      userName: profile.displayName || profile.username,
      email,
      githubId: profile.id,
      picUrl: githubPicture,
    };

    let user = await authModel.findOne({
      githubId: profile.id,
    });

    if (user) {
      user.userName = newUser.userName;

      if (githubPicture) {
        user.picUrl = githubPicture;
      }

      await user.save();
      return cb(null, user);
    }

    const savedUser = await authModel(newUser).save();
    return cb(null, savedUser);
  } catch (err) {
    return cb(err);
  }
};

const LocalStrategycallback = async (email, password, done) => {
  try {
    const user = await authModel.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return done(null, false, {
        message: "Email not registered",
      });
    }

    if (!user.password) {
      return done(null, false, {
        message: "Please set your password using Forgot Password first.",
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return done(null, false, {
        message: "Incorrect password",
      });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
};

passport.use(
  new GoogleStrategy(googleCredentials, callback)
);

passport.use(
  new GitHubStrategy(githubCredentials, githubCallback)
);

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    LocalStrategycallback
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((userId, done) => {
  authModel
    .findById(userId)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err);
    });
});

module.exports = passport;

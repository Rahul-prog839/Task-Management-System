
const mongoose = require("mongoose");

const dataDatabase = mongoose.createConnection(
  process.env.MONGO_URL
);

// TODO SCHEMA
const todoSchema = new mongoose.Schema(
  {
    todoId: { type: String },
    title: { type: String },
    status: { type: Boolean }
  },
  { _id: false }
);

// NOTES SCHEMA
const noteSchema = new mongoose.Schema(
  {
    id: { type: String },
    title: { type: String },
    noteText: { type: String },
    date: { type: String },
    time: { type: String }
  },
  { _id: false }
);

// TASK SCHEMA WITH REMINDERS
const currTaskSchema = new mongoose.Schema(
  {
    id: { type: String },

    task: {
      taskName: { type: String },
      priority: { type: String },
      deadline: { type: String },

      // Task deadline time
      deadlineTime: {
        type: String,
        default: "09:00"
      },

      // Reminder interval in minutes
      reminderMinutesBefore: {
        type: Number,
        default: 30
      },

      // Calculated reminder date and time
      reminderAt: {
        type: Date,
        default: null
      }
    },

    done: {
      type: Boolean,
      default: false
    },

    completedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

// MAIN USER DATA SCHEMA
const schema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  todos: {
    type: [todoSchema],
    default: []
  },

  notes: {
    type: [noteSchema],
    default: []
  },

  tasks: {
    type: [currTaskSchema],
    default: []
  }
});

module.exports = dataDatabase.model("UserData", schema);

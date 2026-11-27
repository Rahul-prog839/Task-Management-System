
const taskRoutes = require("express").Router();
const dataModel = require("../Models/DataModel");

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const getOrCreateUserData = async (userId) => {
  try {
    const userData = await dataModel.findOneAndUpdate(
      { _id: userId },
      {
        $setOnInsert: {
          todos: [],
          notes: [],
          tasks: []
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    return userData;

  } catch (error) {
  
    if (error.code === 11000) {
      const existingDocument = await dataModel.findById(userId);

      if (existingDocument) {
        return existingDocument;
      }
    }

    throw error;
  }
};


// GET ALL TASKS
taskRoutes.get("/getTask", async (req, res) => {
  try {
    const { _id } = req.user;

    const userData = await getOrCreateUserData(_id);

    return res.json(userData.tasks || []);

  } catch (error) {
    console.error("Get Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch tasks"
    });
  }
});


// ADD NEW TASK
taskRoutes.post("/postTask", async (req, res) => {
  try {
    const { _id } = req.user;
    const newTask = req.body;

    // Validate task details
    if (
      !newTask.id ||
      !newTask.task ||
      !newTask.task.taskName ||
      !newTask.task.deadline
    ) {
      return res.status(400).json({
        success: false,
        message: "Task name and deadline are required"
      });
    }

    await getOrCreateUserData(_id);

    const updatedDocument = await dataModel.findByIdAndUpdate(
      _id,
      {
        $push: {
          tasks: {
            ...newTask,
            task: {
              ...newTask.task,
              deadlineTime: newTask.task.deadlineTime || "09:00",
              reminderMinutesBefore:
                newTask.task.reminderMinutesBefore ?? 30,
              reminderAt: newTask.task.reminderAt || null
            },
            done: false,
            completedAt: null
          }
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedDocument) {
      return res.status(404).json({
        success: false,
        message: "User data not found"
      });
    }

    return res.status(201).json({
      success: true,
      message: "Task added successfully",
      tasks: updatedDocument.tasks
    });

  } catch (error) {
    console.error("Post Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save task"
    });
  }
});


// UPDATE TASK COMPLETION STATUS
taskRoutes.patch("/updateTask/:id", async (req, res) => {
  try {
    const { _id } = req.user;
    const { id } = req.params;
    const { done } = req.body;

    if (typeof done !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid task status"
      });
    }

    const updatedDocument = await dataModel.findOneAndUpdate(
      {
        _id,
        "tasks.id": id
      },
      {
        $set: {
          "tasks.$.done": done,
          "tasks.$.completedAt": done ? new Date() : null
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedDocument) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    return res.json({
      success: true,
      message: "Task updated successfully",
      tasks: updatedDocument.tasks
    });

  } catch (error) {
    console.error("Update Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update task"
    });
  }
});


// DELETE TASK
taskRoutes.delete("/deleteTask/:id", async (req, res) => {
  try {
    const { _id } = req.user;
    const { id } = req.params;

    const updatedDocument = await dataModel.findByIdAndUpdate(
      _id,
      {
        $pull: {
          tasks: { id }
        }
      },
      { new: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({
        success: false,
        message: "User data not found"
      });
    }

    return res.json({
      success: true,
      message: "Task deleted successfully",
      tasks: updatedDocument.tasks
    });

  } catch (error) {
    console.error("Delete Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete task"
    });
  }
});


// TASK ANALYTICS
taskRoutes.get("/analytics", async (req, res) => {
  try {
    const { _id } = req.user;

    const userData = await dataModel.findById(_id);
    const tasks = userData?.tasks || [];

    // BASIC STATISTICS
    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
      task => task.done === true
    ).length;

    const pendingTasks = tasks.filter(
      task => task.done !== true
    ).length;

    // DATE SETUP
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    const todayKey = formatDate(today);
    const tomorrowKey = formatDate(tomorrow);
    const sevenDaysKey = formatDate(sevenDaysLater);

    // OVERDUE COUNT
    const overdueTasks = tasks.filter(task => {
      if (task.done || !task.task?.deadline) {
        return false;
      }

      return task.task.deadline < todayKey;
    }).length;

    // COMPLETION RATE
    const completionRate = totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

    // PRIORITY STATISTICS
    const priorityStats = {
      top: tasks.filter(
        task => task.task?.priority === "top"
      ).length,

      average: tasks.filter(
        task => task.task?.priority === "average"
      ).length,

      low: tasks.filter(
        task => task.task?.priority === "low"
      ).length
    };

    // WEEKLY PRODUCTIVITY
  
    const weeklyProductivity = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const dateKey = formatDate(date);

      const completedCount = tasks.filter(task => {
        if (!task.done || !task.completedAt) {
          return false;
        }

        const completedDate = new Date(task.completedAt);

        if (isNaN(completedDate.getTime())) {
          return false;
        }

        return formatDate(completedDate) === dateKey;
      }).length;

      weeklyProductivity.push({
        day: date.toLocaleDateString("en-US", {
          weekday: "short"
        }),
        date: dateKey,
        completed: completedCount
      });
    }

    // PENDING TASKS WITH VALID DEADLINES
    const pendingDeadlineTasks = tasks
      .filter(task => {
        if (task.done || !task.task?.deadline) {
          return false;
        }

        return /^\d{4}-\d{2}-\d{2}$/.test(
          task.task.deadline
        );
      })
      .map(task => ({
        id: task.id,
        title: task.task.taskName,
        priority: task.task.priority,
        deadline: task.task.deadline
      }))
      .sort((a, b) =>
        a.deadline.localeCompare(b.deadline)
      );

    // DEADLINE CATEGORIES
    const overdueList = pendingDeadlineTasks.filter(
      task => task.deadline < todayKey
    );

    const dueToday = pendingDeadlineTasks.filter(
      task => task.deadline === todayKey
    );

    const dueTomorrow = pendingDeadlineTasks.filter(
      task => task.deadline === tomorrowKey
    );

    const upcomingTasks = pendingDeadlineTasks.filter(
      task =>
        task.deadline > tomorrowKey &&
        task.deadline <= sevenDaysKey
    );

    // SEND ANALYTICS RESPONSE
    return res.json({
      success: true,

      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate,

      priorityStats,

      weeklyProductivity,

      overdueList,
      dueToday,
      dueTomorrow,
      upcomingTasks
    });

  } catch (error) {
    console.error("Analytics Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch analytics"
    });
  }
});


module.exports = taskRoutes;

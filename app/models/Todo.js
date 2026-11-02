const mongoose = require("mongoose");

const TodoSchema = new mongoose.Schema({
    task: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: ""
    },

    completed: {
        type: Boolean,
        default: false
    },

    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },

    dueDate: {
        type: Date,
        default: null
    },

    bookmarked: {
        type: Boolean,
        default: false
    },

    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports =
    mongoose.models.todos ||
    mongoose.model("todos", TodoSchema);
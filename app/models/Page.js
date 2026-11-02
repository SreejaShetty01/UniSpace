const mongoose = require("mongoose");

const PageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    content: {
        type: String,
        default: ""
    },

    bookmarked: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports =
    mongoose.models.Page ||
    mongoose.model("Page", PageSchema);
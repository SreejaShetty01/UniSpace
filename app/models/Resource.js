const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        default: "General"
    },
    bookmarked: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports =
    mongoose.models.Resource ||
    mongoose.model("Resource", ResourceSchema);
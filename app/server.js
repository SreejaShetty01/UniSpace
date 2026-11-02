const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const moment = require("moment");
const router = require("./routes/front");

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.locals.moment = moment;
app.use((req, res, next) => {
    res.locals.currentPage = req.path === "/" ? "dashboard" : req.path.split("/")[1];
    res.locals.notice = typeof req.query.notice === "string" ? req.query.notice : "";
    next();
});
app.use(router);
app.use((req, res) => res.status(404).send("Page not found."));
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).send("Something went wrong. Please try again.");
});

const PORT = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI || require("./config/keys").mongoProdURI;

mongoose.connect(mongoUri)
    .then(() => {
        console.log("MongoDB connected");
        app.listen(PORT, "0.0.0.0", () => console.log(`UniSpace listening on port ${PORT}`));
    })
    .catch(error => {
        console.error("MongoDB connection failed:", error.message);
        process.exitCode = 1;
    });

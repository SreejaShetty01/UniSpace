const express = require("express");
const mongoose = require("mongoose");
const Todo = require("../models/Todo");
const Page = require("../models/Page");
const Resource = require("../models/Resource");

const router = express.Router();
const safeText = value => typeof value === "string" ? value.trim() : "";
const validId = id => mongoose.isValidObjectId(id);
const go = (res, path, message) => res.redirect(`${path}?notice=${encodeURIComponent(message)}`);
const failure = (res, _path, error) => {
    console.error(error);
    return res.status(500).send("That request could not be completed. Please try again.");
};

router.get("/", async (req, res) => {
    try {
        const [tasks, pages, resources] = await Promise.all([
            Todo.find().sort({ created_at: -1 }).limit(5),
            Page.find().sort({ updatedAt: -1 }).limit(4),
            Resource.find().sort({ createdAt: -1 }).limit(5)
        ]);
        const [taskCount, completedCount, pageCount, resourceCount] = await Promise.all([
            Todo.countDocuments(), Todo.countDocuments({ completed: true }),
            Page.countDocuments(), Resource.countDocuments()
        ]);
        res.render("dashboard", { tasks, pages, resources, stats: { taskCount, completedCount, pageCount, resourceCount } });
    } catch (error) { failure(res, "/", error); }
});

router.get("/tasks", async (req, res) => {
    try { res.render("tasks", { tasks: await Todo.find().sort({ created_at: -1 }) }); }
    catch (error) { failure(res, "/tasks", error); }
});

router.post("/tasks/add", async (req, res) => {
    const task = safeText(req.body.task);
    const priority = ["Low", "Medium", "High"].includes(req.body.priority) ? req.body.priority : "Medium";
    if (!task) return go(res, "/tasks", "Add a task name first.");
    try {
        const dueDate = safeText(req.body.dueDate);
        if (dueDate && Number.isNaN(Date.parse(dueDate))) return go(res, "/tasks", "Choose a valid due date.");
        await Todo.create({ task, description: safeText(req.body.description), priority, dueDate: dueDate || null });
        go(res, "/tasks", "Task added.");
    } catch (error) { failure(res, "/tasks", error); }
});

router.post("/tasks/:id/edit", async (req, res) => {
    const task = safeText(req.body.task);
    if (!validId(req.params.id) || !task) return go(res, "/tasks", "Task title is required.");
    const priority = ["Low", "Medium", "High"].includes(req.body.priority) ? req.body.priority : "Medium";
    const dueDate = safeText(req.body.dueDate);
    if (dueDate && Number.isNaN(Date.parse(dueDate))) return go(res, "/tasks", "Choose a valid due date.");
    try {
        const result = await Todo.findByIdAndUpdate(req.params.id, { task, description: safeText(req.body.description), priority, dueDate: dueDate || null }, { runValidators: true });
        go(res, "/tasks", result ? "Task updated." : "Task not found.");
    } catch (error) { failure(res, "/tasks", error); }
});

router.post("/tasks/:id/complete", async (req, res) => {
    try {
        if (!validId(req.params.id)) return go(res, "/tasks", "Task not found.");
        const item = await Todo.findById(req.params.id);
        if (!item) return go(res, "/tasks", "Task not found.");
        item.completed = !item.completed; await item.save();
        go(res, "/tasks", item.completed ? "Task completed." : "Task marked pending.");
    } catch (error) { failure(res, "/tasks", error); }
});

router.post("/tasks/:id/bookmark", async (req, res) => {
    const back = req.body.returnTo === "bookmarks" ? "/bookmarks" : "/tasks";
    try {
        if (!validId(req.params.id)) return go(res, back, "Task not found.");
        const item = await Todo.findById(req.params.id);
        if (!item) return go(res, back, "Task not found.");
        item.bookmarked = !item.bookmarked; await item.save();
        go(res, back, item.bookmarked ? "Task bookmarked." : "Task removed from bookmarks.");
    } catch (error) { failure(res, back, error); }
});

router.post("/tasks/:id/delete", async (req, res) => {
    try {
        if (validId(req.params.id)) await Todo.findByIdAndDelete(req.params.id);
        go(res, "/tasks", "Task deleted.");
    } catch (error) { failure(res, "/tasks", error); }
});

router.get("/pages", async (req, res) => {
    try { res.render("pages", { pages: await Page.find().sort({ updatedAt: -1 }) }); }
    catch (error) { failure(res, "/pages", error); }
});

router.post("/pages/add", async (req, res) => {
    const title = safeText(req.body.title);
    if (!title) return go(res, "/pages", "Add a page title first.");
    try { await Page.create({ title, content: safeText(req.body.content) }); go(res, "/pages", "Page created."); }
    catch (error) { failure(res, "/pages", error); }
});

router.post("/pages/:id/edit", async (req, res) => {
    const title = safeText(req.body.title);
    if (!validId(req.params.id) || !title) return go(res, "/pages", "Page title is required.");
    try {
        const page = await Page.findByIdAndUpdate(req.params.id, { title, content: safeText(req.body.content), updatedAt: new Date() }, { runValidators: true });
        go(res, "/pages", page ? "Page updated." : "Page not found.");
    } catch (error) { failure(res, "/pages", error); }
});

router.post("/pages/:id/bookmark", async (req, res) => {
    const back = req.body.returnTo === "bookmarks" ? "/bookmarks" : "/pages";
    try {
        if (!validId(req.params.id)) return go(res, back, "Page not found.");
        const item = await Page.findById(req.params.id);
        if (!item) return go(res, back, "Page not found.");
        item.bookmarked = !item.bookmarked; item.updatedAt = new Date(); await item.save();
        go(res, back, item.bookmarked ? "Page bookmarked." : "Page removed from bookmarks.");
    } catch (error) { failure(res, back, error); }
});

router.post("/pages/:id/delete", async (req, res) => {
    try { if (validId(req.params.id)) await Page.findByIdAndDelete(req.params.id); go(res, "/pages", "Page deleted."); }
    catch (error) { failure(res, "/pages", error); }
});

router.get("/library", async (req, res) => {
    try { res.render("library", { resources: await Resource.find().sort({ createdAt: -1 }) }); }
    catch (error) { failure(res, "/library", error); }
});

const resourceFields = body => {
    const url = safeText(body.url);
    let parsed;
    try { parsed = new URL(url); } catch (_) { return { error: "Enter a valid web address." }; }
    if (!['http:', 'https:'].includes(parsed.protocol)) return { error: "Resource links must use http or https." };
    const title = safeText(body.title);
    if (!title) return { error: "Resource title is required." };
    return { fields: { title, url: parsed.href, description: safeText(body.description), category: safeText(body.category) || "General" } };
};

router.post("/library/add", async (req, res) => {
    const result = resourceFields(req.body);
    if (result.error) return go(res, "/library", result.error);
    try { await Resource.create(result.fields); go(res, "/library", "Resource saved."); }
    catch (error) { failure(res, "/library", error); }
});

router.post("/library/:id/edit", async (req, res) => {
    const result = resourceFields(req.body);
    if (!validId(req.params.id) || result.error) return go(res, "/library", result.error || "Resource not found.");
    try {
        const resource = await Resource.findByIdAndUpdate(req.params.id, result.fields, { runValidators: true });
        go(res, "/library", resource ? "Resource updated." : "Resource not found.");
    } catch (error) { failure(res, "/library", error); }
});

router.post("/library/:id/bookmark", async (req, res) => {
    const back = req.body.returnTo === "bookmarks" ? "/bookmarks" : "/library";
    try {
        if (!validId(req.params.id)) return go(res, back, "Resource not found.");
        const item = await Resource.findById(req.params.id);
        if (!item) return go(res, back, "Resource not found.");
        item.bookmarked = !item.bookmarked; await item.save();
        go(res, back, item.bookmarked ? "Resource bookmarked." : "Resource removed from bookmarks.");
    } catch (error) { failure(res, back, error); }
});

router.post("/library/:id/delete", async (req, res) => {
    try { if (validId(req.params.id)) await Resource.findByIdAndDelete(req.params.id); go(res, "/library", "Resource deleted."); }
    catch (error) { failure(res, "/library", error); }
});

router.get("/bookmarks", async (req, res) => {
    try {
        const [tasks, pages, resources] = await Promise.all([
            Todo.find({ bookmarked: true }).sort({ created_at: -1 }),
            Page.find({ bookmarked: true }).sort({ updatedAt: -1 }),
            Resource.find({ bookmarked: true }).sort({ createdAt: -1 })
        ]);
        res.render("bookmarks", { tasks, pages, resources });
    } catch (error) { failure(res, "/bookmarks", error); }
});

module.exports = router;

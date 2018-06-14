const express = require("express");
const app = express();
const PORT = 1337;
const { promisify } = require("util");
const fs = require("fs");
const readDir = promisify(fs.readdir);
const stats = promisify(fs.stat);
const { pipeRender, renderError } = require("./controllers");

function attachPipeRender (req, res, next) {
  res.pipeRender = pipeRender;
  next();
}

app.use(express.static("pages"));
app.use(attachPipeRender);
app.get("/view/:trainingId/:slideNumber", renderTraining);
app.get("/edit/:trainingId", editTraining);

app.listen(PORT, () => {
	process.stdout.write("\033c"); //Clear console
	console.log(`Express server online!\nListening on port ${PORT}`);
});

async function renderTraining (req, res) {
	try {
		const trainingPath = `${__dirname}/pages/${req.params.trainingId}`;
		const slides = (await readDir(trainingPath)).filter(async fileOrFolder => {
			const fileOrFolderStats = await stats(`${trainingPath}/${fileOrFolder}`);
			return fileOrFolderStats.isDirectory() && fileOrFolder.includes("slide");
		});
		const locals = {
			id: req.params.trainingId,
			slideNumber: Number(req.params.slideNumber),
			folder: `${req.params.trainingId}/slide${req.params.slideNumber}`,
			totalSlides: slides.length
		};
		res.pipeRender("slide", locals);
	} catch (error) {
		renderError(res, error);
	}
}

async function editTraining (req, res) {
	try {
		const trainingPath = `${__dirname}/pages/${req.params.trainingId}`;
		const slides = (await readDir(trainingPath)).filter(async fileOrFolder => {
			const fileOrFolderStats = await stats(`${trainingPath}/${fileOrFolder}`);
			return fileOrFolderStats.isDirectory() && fileOrFolder.includes("slide");
		});
		const locals = {
			id: req.params.trainingId,
			folder: `${__dirname}/pages`,
			slides: slides,
			stylesheet: null,
			header: null,
			footer: null,
			script: null
		};
		res.pipeRender("edit", locals);
	} catch (error) {
		renderError(res, error);
	}
}
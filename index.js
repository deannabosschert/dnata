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
app.get("/view/:trainingId", (req, res) => {
	res.redirect(`/view/${req.params.trainingId}/1`);
});
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
			if (!fileOrFolder.includes("slide")) console.log(`"${fileOrFolder}" is not a valid directory; consider removing it from ${trainingPath}`);
			return fileOrFolderStats.isDirectory() && fileOrFolder.includes("slide");
		});
		const consecutive = slides.every((slide, i) => {
			const prevSlide = slides[i-1];
			if (!prevSlide) return true;
			return Number(prevSlide[prevSlide.length-1]) === Number(slide[slide.length-1]) - 1;
		});
		if (!consecutive) console.log(`Slides in ${req.params.trainingId} are not consecutive; Consider renaming them in order.`);
		const slideNumber = Number(req.params.slideNumber);
		const locals = {
			id: req.params.trainingId,
			slideNumber: slideNumber,
			folder: `${req.params.trainingId}/slide${slideNumber}`,
			totalSlides: slides.length
		};
		res.pipeRender("slide", locals);
	} catch (error) {
		renderError(res, {
			message: error,
			code: 500
		});
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
			script: null,
			daisy: ()=>{console.log("Cannot load daisy.")}
		};
		res.pipeRender("edit", locals);
	} catch (error) {
		renderError(res, {
			message: error,
			code: 500
		});
	}
}
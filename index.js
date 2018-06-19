const express = require("express");
const app = express();
const PORT = 1337;
const { promisify } = require("util");
const fs = require("fs");
const readDir = promisify(fs.readdir);
const stats = promisify(fs.stat);
const { pipeRender, renderError } = require("./controllers");
const session = require("express-session");
const bodyParser = require("body-parser").urlencoded({ extended: false });

function attachPipeRender (req, res, next) {
  res.pipeRender = pipeRender;
  next();
}

app.use(express.static("pages"));
app.use(bodyParser);
app.use(session({
  secret: "Gekste geheime dnata sessie",
  resave: false,
	saveUninitialized: false
}));
app.use(attachPipeRender);
app.get("/", loadTrainings);
app.get("/view/:trainingId/:slideNumber", renderTraining);
app.get("/view/:trainingId", (req, res) => {
	res.redirect(`/view/${req.params.trainingId}/1`);
});
app.get("/edit/:trainingId", editTraining);
app.post("/save/:trainingId", saveTraining);

app.listen(PORT, () => {
	process.stdout.write("\033c"); //Clear console
	console.log(`Express server online!\nListening on port ${PORT}`);
});

async function loadTrainings (req, res) {
	const path = `${__dirname}/pages`;
	const items = await readDir(path);
	const trainings = [];
	for (const i in items) {
		const item = items[i];
		const itemStats = await stats(`${path}/${item}`);
		if (itemStats.isDirectory() && !["daisy", "edit", "overview", "slide"].includes(item)) trainings.push(item);
	}
	res.pipeRender("overview", { trainings: trainings });
}

async function getSlides (req) {
	const trainingPath = `${__dirname}/pages/${req.params.trainingId}`;
	const items = await readDir(trainingPath);
	const slides = [];
	for (const i in items) {
		const item = items[i];
		const itemStats = await stats(`${trainingPath}/${item}`);
		if (!(item.includes("slide") || item.includes("BACKUP"))) console.log(`Warning: "${item}" is not a valid slide directory; consider removing it from ${trainingPath}`);
		if (itemStats.isDirectory() && item.includes("slide")) slides.push(item);
	}
	const consecutive = items.every((slide, i) => {
		const prevSlide = items[i-1];
		if (!prevSlide) return slide === "slide1";
		return Number(prevSlide[prevSlide.length-1]) === Number(slide[slide.length-1]) - 1;
	});
	if (!consecutive) console.log(`Critical Warning: Slides in ${req.params.trainingId} are not consecutive; consider renaming them in order.`);
	return slides;
}

async function renderTraining (req, res) {
	try {
		const slides = await getSlides(req);
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
		const slides = await getSlides(req);
		const locals = {
			id: req.params.trainingId,
			folder: `${__dirname}/pages`,
			slides: slides,
			stylesheet: null,
			header: null,
			footer: null,
			script: null,
			daisy: ()=>{console.log("Warning: Cannot load daisy.")}
		};
		res.pipeRender("edit", locals);
	} catch (error) {
		renderError(res, {
			message: error,
			code: 500
		});
	}
}

function saveTraining (req, res) {
	//
}
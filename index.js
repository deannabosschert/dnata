const express = require("express");
const app = express();
const PORT = 1337;
const { promisify } = require("util");
const fs = require("fs");
const readDir = promisify(fs.readdir);
const stats = promisify(fs.stat);
const writeFile = promisify(fs.writeFile);
const { pipeRender, renderError } = require("./controllers");
const bodyParser = require("body-parser");
const copyDir = promisify(require("ncp").ncp);
const mkdirp = require("mkdirp");
const dirName = require("path").dirname;

function attachPipeRender (req, res, next) {
  res.pipeRender = pipeRender;
  next();
}

app.use(express.static("pages"));
app.use(
	bodyParser.urlencoded({ extended: false }),
	bodyParser.text()
);
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
		if (itemStats.isDirectory() && !["daisy", "edit", "overview", "slide", "backups"].includes(item)) trainings.push(item);
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
		if (!item.includes("slide")) console.log(`Warning: "${item}" is not a valid slide directory; consider removing it from ${trainingPath}`);
		if (itemStats.isDirectory() && item.includes("slide")) slides.push(item);
	}
	const consecutive = items.every((slide, i) => {
		const prevSlide = items[i-1];
		if (!prevSlide) return slide === "slide1";
		return Number(prevSlide[prevSlide.length-1]) === Number(slide[slide.length-1]) - 1;
	});
	if (!consecutive) console.log(`Critical Warning: Slides in ${req.params.trainingId} are not consecutive; rename them in order!`);
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

function padLeft (str, padString = " ", targetLength) {
	if (typeof str !== "string") str = str.toString();
	if (str.length > targetLength) return str;
	return padString.repeat(Math.max(0, targetLength - str.length)) + str;
}

function fileExists (path) {
	return new Promise((resolve, reject) => {
		fs.access(path, err => {
			resolve(err ? false : true);
		});
	});
}

function writeNewFile (path, data) {
	mkdirp(dirName(path), async err => {
		if (err) throw err;
		return await writeFile(path, data);
	});
}

function saveTrainingFile (path, data) {
	return new Promise(async (resolve, reject) => {
		//Check if path exists
		if (!await fileExists(path)) {
			resolve(await writeNewFile(path, data));
		} else {
			const stream = fs.createWriteStream(path);
			stream.on("close", () => {
				resolve(true);
			});
			stream.on("error", err => {
				reject(err);
			});
			stream.write(data);
			stream.close();
		}
	});
}

async function saveTraining (req, res) {
	try {
		req.body = JSON.parse(req.body);
		const path = `${__dirname}/pages/${req.body.id}`;
		//Ensure path is safe (maybe take more precaution?)
		if (path.match(/\.\/\\/g)) throw new Error("Path cannot contain dots or (back)slashes!");

		//backup
		const date = new Date();
		const dateString = `${date.getFullYear()}_${padLeft(date.getMonth(), "0", 2)}_${padLeft(date.getDay(), "0", 2)}`;
		await copyDir(path, `${__dirname}/pages/backups/${req.body.id} BACKUP_${dateString}`);

		//overwrite old
		for (const i in req.body.slides) {
			const html = req.body.slides[i];
			await saveTrainingFile(`${path}/slide${Number(i) + 1}/index.ejs`, html);
		}

		res.end(JSON.stringify({
			ok: true,
			body: req.body
		}));
	} catch (err) {
		console.log(err);
		res.end(JSON.stringify({
			ok: false,
			error: err.stack || err
		}));
	}
}
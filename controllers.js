const ejs = require("ejs-stream");
const fs = require("fs");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);

function escapeHTML (html) {
	try {
		html = (typeof html === "string") ? html : html.toString();
	} catch (err) {
		html = String(html);
	}
	return html.replace(/[\t&"<>]/g, _catch => {
		return {
			"&":  "&amp;",
			'"':  "&quot;",
			"<":  "&lt;",
			">":  "&gt;",
			"\t": "  "
		}[_catch];
	});
}

function renderError (res, error) {
	res.set({
		"Content-Type": "text/html; charset=utf-8"
	});
	res.end(`
		<head>
			<title>Error!</title>
			<style>::-webkit-scrollbar { display: none; }</style>
		</head>
		<body style="font-family: 'Fira Code', monospace; width: 50vw; margin: 25vh auto">
			<div style="position: absolute; width: 8rem; height: 8rem; background: rgb(0, 136, 203); top: 0; left: 2rem; display: inline-flex; justify-content: center; align-items: center; flex-wrap: wrap;"><img style="width: 75%; filter: brightness(0) invert(1);" src="/slide/logo.png" alt="Logo"></div>
			<h1 style="display: block; font-size: 3rem; margin-bottom: -1.75rem">Oh no! 😱</h1>
			<p style="display: block; font-size: 1.5rem; color: rgb(150, 150, 150)">INTERNAL SERVER ERROR ${error.code}: ${error.message.code}</p>
			<p style="font-family: sans-serif; margin-top: 2rem; font-size: 2rem;">Don't worry, it's not your fault.</p>
			<code style="margin-top: 4rem; overflow-x: auto; display: block; color: rgb(253, 94, 108); background: rgb(20, 20, 36); margin: 0 -1rem; border-radius: 4px;">
				<pre style="margin: 0; padding: 1rem;">${escapeHTML(error.message)}</pre>
			</code>
			<p style="font-family: sans-serif; text-align: center; margin-top: 3rem;">Please notify a supervisor or technician. 🔧</p>
		</body>
	`);
}
module.exports.renderError = renderError;

module.exports.pipeRender = async function pipeRender (folderOrIndex, locals) {
	this.set({
		"Content-Type": "text/html; charset=utf-8"
	});
	folderOrIndex = `${__dirname}/pages/${folderOrIndex}`;
	try {
		if (!folderOrIndex.includes("index.ejs")) folderOrIndex += "/index.ejs";
		const stream = ejs(await readFile(folderOrIndex, "utf8"), {filename: folderOrIndex});
		stream.write(locals);
		stream.pipe(this);
		stream.end();
	} catch (error) {
		renderError(this, {
			message: error,
			code: 500
		});
	}
}
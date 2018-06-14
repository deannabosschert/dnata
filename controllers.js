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
	res.end(`
		<head>
			<title>Error!</title>
			<style>::-webkit-scrollbar { display: none; }</style>
		</head>
		<body style="font-family: 'Fira Code', monospace; width: 50vw; margin: 25vh auto">
			<h1 style="display: block; font-size: 3rem; margin-bottom: -1.75rem">Uh oh,</h1>
			<p style="display: block; font-size: 1.5rem; color: rgb(150, 150, 150)">Something went wrong! 😱</p>
			<code style="overflow-x: auto; display: block; color: rgb(248, 56, 79); background: rgb(20, 20, 36); margin: 0 -1rem; border-radius: 4px;">
				<pre style="margin: 0; padding: 1rem;">${escapeHTML(error)}</pre>
			</code>
		</body>
	`);
}
module.exports.renderError = renderError;

module.exports.pipeRender = async function pipeRender (folderOrIndex, locals) {
	this.set("Content-Type", "text/html");
	folderOrIndex = `${__dirname}/pages/${folderOrIndex}`;
	try {
		if (!folderOrIndex.includes("index.ejs")) folderOrIndex += "/index.ejs";
		const stream = ejs(await readFile(folderOrIndex, "utf8"), {filename: folderOrIndex});
		stream.write(locals);
		stream.pipe(this);
		stream.end();
	} catch (error) {
		renderError(this, error);
	}
}
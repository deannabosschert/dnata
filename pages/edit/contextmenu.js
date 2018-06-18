//Construct contextmenu
const contextmenu = document.querySelector("#contextMenu");
function buildMenu (menu) {
	for (const menuitem of menu.children) {
		const label = document.createTextNode(menuitem.dataset.label);
		menuitem.prepend(label);
		if (menuitem.dataset.icon) {
			const img = document.createElement("IMG");
			img.src = menuitem.dataset.icon;
			menuitem.prepend(img);
		}
		const submenu = menuitem.querySelector("ul");
		if (submenu) {
			submenu.style.left = `${contextmenu.getBoundingClientRect().width / 2 + 2 * rem}px`;
			submenu.style.top = `${5 * rem}px`;
			buildMenu(submenu);
		}
	}
}
buildMenu(contextmenu);
document.body.addEventListener("contextmenu", event => {
	event.preventDefault();
	const width = contextmenu.getBoundingClientRect().width;
	const height = contextmenu.getBoundingClientRect().height;
	contextmenu.classList.add("show");
	contextmenu.style.left = `${Math.min(event.clientX, window.innerWidth - width)}px`;
	contextmenu.style.top = `${Math.min(event.clientY, window.innerHeight - height)}px`;
	document.querySelectorAll("body>*:not(#contextMenu)").forEach(element => {
		element.classList.add("blur");
	});
});
document.body.addEventListener("click", event => {
	if (Array.from(document.querySelectorAll("#contextMenu, #contextMenu>*")).includes(event.srcElement)) return;
	document.querySelectorAll(".menu.show").forEach(element => {
		element.classList.remove("show");
	});
	contextmenu.style.left = "0px";
	contextmenu.style.top = "0px";
	document.querySelectorAll(".blur").forEach(element => {
		element.classList.remove("blur");
	});
});

function openMenuInside (menuitem) {
	menuitem.parentElement.querySelectorAll(".show").forEach(element => {
		element.classList.remove("show");
	});
	menuitem.querySelector("ul.menu").classList.toggle("show");
}

function addTitle () {
	const title = document.createElement("H1");
	title.textContent = "Voer hier uw tekst in";
	title.classList.add("dnata-title");
	const main = document.querySelector('body>main>main') || document.querySelector('body>main')
	main.appendChild(title);
}

function addSubtitle () {
	const subtitle = document.createElement("H2");
	subtitle.textContent = "Voer hier uw tekst in";
	subtitle.classList.add("dnata-subtitle");
	const main = document.querySelector('body>main>main') || document.querySelector('body>main')
	main.appendChild(subtitle);
}

function addParagraph () {
	const paragraph = document.createElement("P");
	paragraph.textContent = "Voer hier uw tekst in";
	paragraph.classList.add("dnata-paragraph");
	const main = document.querySelector('body>main>main') || document.querySelector('body>main')
	main.appendChild(paragraph);
}

function addFigure () {
	const img = document.createElement("IMG");
	img.src = "./images/figure.png";
	img.classList.add("srcEditable", "dnata-figure");
	const main = document.querySelector('body>main>main') || document.querySelector('body>main')
	main.appendChild(img);
}
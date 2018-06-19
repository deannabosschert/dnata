let preventLeaving = false;
const headerAnchor = document.querySelector("body>header>a");

headerAnchor.addEventListener("animationend", () => {
	headerAnchor.querySelector("img").src = "/edit/images/prev.png";
	headerAnchor.removeAttribute("style");
	allowLeaving();
});

window.onbeforeunload = () => {
	if (preventLeaving) return false;
}

function preventLeavingBeforeSaving () {
	preventLeaving = true;
	headerAnchor.href = "javascript:void(0)";
	headerAnchor.title = "Opslaan";
	headerAnchor.querySelector("img").src = "/edit/images/save.png";
}

function allowLeaving () {
	preventLeaving = false;
	headerAnchor.href = "/";
	headerAnchor.title = "Terug";
}

function save () {
	headerAnchor.querySelector("img").src = "/edit/images/loading.png";
	headerAnchor.style.animation = "loading 1s ease-in-out";
	const id = headerAnchor.dataset.id;
	// MAKE SURE ONLY USERS WITH PROPER AUTHORISATION CAN EDIT
	const slides = [];
	document.querySelectorAll(".slide").forEach(slide => {
		slides.push(`<html>${slide.innerHTML.replace(/\s+/g, (m) => {
			if (m.match(/[\r\n\t\f\v]/g)) return "";
			return " ";
		})}</html>`);
	});
	const json = JSON.stringify({id: id, slides: slides});
	fetch(new Request(`http://localhost:1337/save/${id}`), {
		method: "POST",
		body: json
	})
	.then(res => res.json())
	.then(json => {
		console.log(json);
	});
}

headerAnchor.addEventListener("click", event => {
	if (!preventLeaving) return;
	event.preventDefault();
	save();
});

function syncChanges (slide) {
	const main = document.querySelector("body>main");
	slide.querySelector("main").remove();
	const newContent = main.cloneNode(true);
	slide.appendChild(newContent);
}

function openSlide (slide) {
	const wrappers = document.querySelectorAll(".slideWrapper");
	const wrapper = slide.parentElement;
	for (const wrapper of wrappers) {
		wrapper.classList.remove("focus");
	}
	wrapper.classList.add("focus");

	const content = document.querySelector("body>main");
	content.remove();
	const newContent = slide.querySelector("main").cloneNode(true);
	document.body.appendChild(newContent);
	
	newContent.setAttribute("contenteditable", "");
	newContent.addEventListener("DOMCharacterDataModified", () => {
		syncChanges(slide);
		preventLeavingBeforeSaving();
	});
}

const rem = Number(getComputedStyle(document.body).fontSize.slice(0, -2));
function resizeSlides () {
	setTimeout(() => {
		const wrappers = document.querySelectorAll(".slideWrapper");
		if (!wrappers[0]) return;
		const viewWidth = Number(getComputedStyle(document.body).width.slice(0, -2));
		const sideWidth = document.querySelector("#sidebar").clientWidth;
		const scale = (sideWidth - .66 * rem) / viewWidth;
		const slideHeight = Number(getComputedStyle(wrappers[0].querySelector(".slide")).height.slice(0, -2)) * scale + .5 * rem;
		wrappers.forEach((wrapper, i) => {
			const slide = wrapper.querySelector(".slide");
			wrapper.onclick = () => {
				openSlide(slide);
			};
			slide.style.transform = `scale(${scale})`;
			slide.style.animation = `fadein .5s ease ${i * 100}ms forwards`;
			slide.parentElement.style.height = `${slideHeight + .5 * rem}px`;
		});
	}, 10);
}
window.addEventListener("resize", resizeSlides);
resizeSlides();
focusAndClickOn(document.querySelector(".slideWrapper"));

function createSlideWrapper () {
	const wrapper = document.createElement("DIV");
	wrapper.classList.add("slideWrapper");
	wrapper.tabIndex = 0;
	return wrapper;
}

function createDeleteButton (wrapper) {
	const button = document.createElement("BUTTON");
	const img = document.createElement("IMG");
	img.src = "/edit/images/bin.png";
	button.appendChild(img);
	button.classList.add("removeSlide");
	button.title = "Verwijder slide";
	button.addEventListener("mouseenter", () => {
		img.src = "/edit/images/openbin.png";
	});
	button.addEventListener("mouseleave", () => {
		img.src = "/edit/images/bin.png";
	});
	button.addEventListener("click", event => {
		event.stopPropagation();
		wrapper.addEventListener("transitionend", () => {
			wrapper.style.display = "none";
			// undo-able maken?
		});
		wrapper.style = "transform-origin: center center; transform: scale(.25); opacity: 0";
		document.querySelector("body>main").remove();
		document.body.appendChild(document.createElement("MAIN"));
		preventLeavingBeforeSaving();
	});
	return button;
}

function createSlide () {
	const slide = document.createElement("ARTICLE");
	slide.classList.add("slide");
	return slide;
}

function setupSlide () {
	const wrapper = createSlideWrapper();
	const deleteButton = createDeleteButton(wrapper);
	const slide = createSlide();
	wrapper.appendChild(deleteButton);
	wrapper.appendChild(slide);
	sidebar.insertBefore(wrapper, document.querySelector("#addSlide"));
	resizeSlides();
	return slide;
}

function focusAndClickOn (element) {
	if (!element) return;
	element.click();
	element.focus();
}

function addSlide () {
	const newSlide = setupSlide();
	newSlide.style.animation = "fadein .5s ease forwards";
	focusAndClickOn(newSlide);
	preventLeavingBeforeSaving();
}

const sidebar = document.querySelector("#sidebar");
const addSlideButtons = document.querySelectorAll(".addSlideButton");
addSlideButtons.forEach(button => {
	button.addEventListener("click", () => {
		addSlide();
	});
});

//Inject delete buttons in loaded slides (which have no buttons)
const buttonlessSlideWrappers = Array.from(document.querySelectorAll(".slideWrapper")).filter(element => {
	return element.childElementCount === 1;
});
for (const wrapper of buttonlessSlideWrappers) {
	wrapper.appendChild(createDeleteButton(wrapper));
}
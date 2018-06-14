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
	//actually save
}

headerAnchor.addEventListener("click", event => {
	if (!preventLeaving) return;
	event.preventDefault();
	save();
});

function openSlide (slide) {
	const main = document.querySelector("body>main");
	while (main.lastChild) {
		main.lastChild.remove();
	}
	main.setAttribute("contenteditable", "");
	main.addEventListener("DOMCharacterDataModified", () => {
		preventLeavingBeforeSaving();
	});
	for (const child of slide.childNodes) {
		const clone = child.cloneNode(true);
		main.appendChild(clone);
	}
}

const rem = Number(getComputedStyle(document.body).fontSize.slice(0, -2));
function resizeSlides () {
	const slides = document.querySelectorAll(".slide");
	if (!slides[0]) return;
	const viewWidth = Number(getComputedStyle(document.body).width.slice(0, -2));
	const sideWidth = document.querySelector("#sidebar").clientWidth;
	const scale = (sideWidth - .66 * rem) / viewWidth;
	const slideHeight = Number(getComputedStyle(slides[0]).height.slice(0, -2)) * scale + .5 * rem;
	slides.forEach((slide, i) => {
		slide.onclick = () => {
			openSlide(slide);
		};
		slide.style.transform = `scale(${scale})`;
		slide.style.animation = `fadein .5s ease ${i * 100}ms forwards`;
		slide.parentElement.style.height = `${slideHeight + .5 * rem}px`;
	});
}
window.addEventListener("resize", resizeSlides);
resizeSlides();
focusAndClickOn(document.querySelector(".slide"));

function createSlideWrapper () {
	const wrapper = document.createElement("DIV");
	wrapper.classList.add("slideWrapper");
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
	button.addEventListener("click", () => {
		wrapper.addEventListener("transitionend", () => {
			wrapper.remove();
		});
		wrapper.style = "transform-origin: center center; transform: scale(.25); opacity: 0";
		preventLeavingBeforeSaving();
	});
	return button;
}

function createSlide () {
	const slide = document.createElement("ARTICLE");
	slide.classList.add("slide");
	slide.tabIndex = 0;
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
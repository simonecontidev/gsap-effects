import { sliderData } from "./sliderData.js";

const config = {
  SCROLL_SPEED: 1.75,
  LERP_FACTOR: 0.05,
  MAX_VELOCITY: 150,
};

const totalSlideCount = sliderData.length;

const state = {
  currentX: 0,
  targetX: 0,
  slideWidth: 390,
  slides: [],
  isDragging: false,
  startX: 0,
  lastX: 0,
  lastMouseX: 0,
  lastScrollTime: Date.now(),
  isMoving: false,
  velocity: 0,
  lastCurrentX: 0,
  dragDistance: 0,
  hasActuallyDragged: false,
  isMobile: false,
};

function checkMobile() {
  state.isMobile = window.innerWidth < 1000;
}

function createSlideElement(index) {
  const slide = document.createElement("div");
  slide.className = "slide";

  if (state.isMobile) {
    slide.style.width = "175px";
    slide.style.height = "250px";
  }

  const imageContainer = document.createElement("div");
  imageContainer.className = "slide-image";

  const img = document.createElement("img");
  const dataIndex = index % totalSlideCount;
  img.src = sliderData[dataIndex].img;
  img.alt = sliderData[dataIndex].title;

  const overlay = document.createElement("div");
  overlay.className = "slide-overlay";

  const title = document.createElement("h1");
  title.className = "project-title";
  // wrapper per reveal
  title.innerHTML = `<span class="reveal">${sliderData[dataIndex].title}</span>`;

  const description = document.createElement("p");
  description.className = "project-description";
  description.textContent = sliderData[dataIndex].description || "";

  const arrow = document.createElement("div");
  arrow.className = "project-arrow";
  arrow.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M7 17L17 7M17 7H7M17 7V17"/>
    </svg>
  `;

  // click-through solo se non drag
 slide.addEventListener("click", (e) => {
  e.preventDefault();
  if (state.dragDistance < 10 && !state.hasActuallyDragged) {
    const url = sliderData[dataIndex].url;

    // salva coordinate per l'enter della prossima pagina
    const x = e.clientX ?? (window.innerWidth / 2);
    const y = e.clientY ?? (window.innerHeight / 2);
    try {
      sessionStorage.setItem("pt:x", String(x));
      sessionStorage.setItem("pt:y", String(y));
    } catch {}

    // opzionale: piccolo zoom dell'immagine + flash overlay (già fatto)
    // poi copri con il cerchio e naviga
    const go = () => { coverFromPoint(x, y, () => { window.location.href = url; }); };

    // se usi già navigateWithZoom(imageContainer, url), richiamala e poi go()
    // oppure fai lo zoom qui:
    gsap.timeline({ defaults: { duration: 0.18, ease: "power2.out" } })
      .to(imageContainer, { scale: 1.04, boxShadow: "0 10px 40px rgba(0,0,0,0.35)" }, 0)
      .to(imageContainer, { scale: 1.0, boxShadow: "0 0 0 rgba(0,0,0,0)" }, "+=0.02")
      .add(go, "+=0"); // subito dopo
  }
});

  // DOM structure
  overlay.appendChild(title);
  imageContainer.appendChild(img);
  slide.appendChild(imageContainer);
  imageContainer.appendChild(overlay);

  const infoBox = document.createElement("div");
  infoBox.className = "slide-info";
  infoBox.appendChild(description);
  infoBox.appendChild(arrow);
  slide.appendChild(infoBox);

  // --- GSAP timeline coordinata ---
  const titleSpan = title.querySelector(".reveal");
  gsap.set(titleSpan, { yPercent: 110, opacity: 0 });
  gsap.set(description, { y: 10, opacity: 0 });
  gsap.set(arrow, { y: 10, opacity: 0 });

  const tl = gsap.timeline({ paused: true });
  tl.to(titleSpan, {
      yPercent: 0,
      opacity: 1,
      duration: 0.6,
      ease: "back.out(1.7)",
      delay: 0.1
    })
    .to(description, {
      y: 0,
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.2")
    .to(arrow, {
      y: 0,
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.3");

  slide.addEventListener("mouseenter", () => tl.play());
  slide.addEventListener("mouseleave", () => tl.reverse());

  return slide;
}

function initializeSlides() {
  const track = document.querySelector(".slide-track");
  track.innerHTML = "";
  state.slides = [];

  checkMobile();
  state.slideWidth = state.isMobile ? 215 : 390;

  const copies = 6;
  const totalSlides = totalSlideCount * copies;

  for (let i = 0; i < totalSlides; i++) {
    const slide = createSlideElement(i);
    track.appendChild(slide);
    state.slides.push(slide);
  }

  const startOffset = -(totalSlideCount * state.slideWidth * 2);
  state.currentX = startOffset;
  state.targetX = startOffset;
}

function updateSlidePositions() {
  const track = document.querySelector(".slide-track");
  const sequenceWidth = state.slideWidth * totalSlideCount;

  if (state.currentX > -sequenceWidth * 1) {
    state.currentX -= sequenceWidth;
    state.targetX -= sequenceWidth;
  } else if (state.currentX < -sequenceWidth * 4) {
    state.currentX += sequenceWidth;
    state.targetX += sequenceWidth;
  }

  track.style.transform = `translate3d(${state.currentX}px, 0, 0)`;
}

function updateParallax() {
  const viewportCenter = window.innerWidth / 2;

  state.slides.forEach((slide) => {
    const img = slide.querySelector("img");
    if (!img) return;

    const slideRect = slide.getBoundingClientRect();

    if (slideRect.right < -500 || slideRect.left > window.innerWidth + 500) {
      return;
    }

    const slideCenter = slideRect.left + slideRect.width / 2;
    const distanceFromCenter = slideCenter - viewportCenter;
    const parallaxOffset = distanceFromCenter * -0.25;

    img.style.transform = `translateX(${parallaxOffset}px) scale(2.25)`;
  });
}

function updateMovingState() {
  state.velocity = Math.abs(state.currentX - state.lastCurrentX);
  state.lastCurrentX = state.currentX;

  const isSlowEnough = state.velocity < 0.1;
  const hasBeenStillLongEnough = Date.now() - state.lastScrollTime > 200;
  state.isMoving =
    state.hasActuallyDragged || !isSlowEnough || !hasBeenStillLongEnough;

  document.documentElement.style.setProperty(
    "--slider-moving",
    state.isMoving ? "1" : "0"
  );
}

function animate() {
  state.currentX += (state.targetX - state.currentX) * config.LERP_FACTOR;

  updateMovingState();
  updateSlidePositions();
  updateParallax();

  requestAnimationFrame(animate);
}

function handleWheel(e) {
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    return;
  }

  e.preventDefault();
  state.lastScrollTime = Date.now();

  const scrollDelta = e.deltaY * config.SCROLL_SPEED;
  state.targetX -= Math.max(
    Math.min(scrollDelta, config.MAX_VELOCITY),
    -config.MAX_VELOCITY
  );
}

function handleTouchStart(e) {
  state.isDragging = true;
  state.startX = e.touches[0].clientX;
  state.lastX = state.targetX;
  state.dragDistance = 0;
  state.hasActuallyDragged = false;
  state.lastScrollTime = Date.now();
}

function handleTouchMove(e) {
  if (!state.isDragging) return;

  const deltaX = (e.touches[0].clientX - state.startX) * 1.5;
  state.targetX = state.lastX + deltaX;
  state.dragDistance = Math.abs(deltaX);

  if (state.dragDistance > 5) {
    state.hasActuallyDragged = true;
  }

  state.lastScrollTime = Date.now();
}

function handleTouchEnd() {
  state.isDragging = false;
  setTimeout(() => {
    state.hasActuallyDragged = false;
  }, 100);
}

function handleMouseDown(e) {
  e.preventDefault();
  state.isDragging = true;
  document.querySelector('.slider')?.classList.add('is-dragging');
  state.startX = e.clientX;
  state.lastMouseX = e.clientX;
  state.lastX = state.targetX;
  state.dragDistance = 0;
  state.hasActuallyDragged = false;
  state.lastScrollTime = Date.now();
}

function handleMouseMove(e) {
  if (!state.isDragging) return;

  e.preventDefault();
  const deltaX = (e.clientX - state.lastMouseX) * 2;
  state.targetX += deltaX;
  state.lastMouseX = e.clientX;
  state.dragDistance += Math.abs(deltaX);

  if (state.dragDistance > 5) {
    state.hasActuallyDragged = true;
  }

  state.lastScrollTime = Date.now();
}

function handleMouseUp() {
  state.isDragging = false;
  setTimeout(() => {
    state.hasActuallyDragged = false;
  }, 100);
  document.querySelector('.slider')?.classList.remove('is-dragging');
}

function handleResize() {
  initializeSlides();
}

function initializeEventListeners() {
  const slider = document.querySelector(".slider");
  const rootSliderEl = slider; // alias leggibile

  slider.addEventListener("wheel", handleWheel, { passive: false });
  slider.addEventListener("touchstart", handleTouchStart);
  slider.addEventListener("touchmove", handleTouchMove);
  slider.addEventListener("touchend", handleTouchEnd);
  slider.addEventListener("mousedown", handleMouseDown);
  slider.addEventListener("mouseleave", handleMouseUp);
  slider.addEventListener("dragstart", (e) => e.preventDefault());

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  window.addEventListener("resize", handleResize);
}

function initializeSlider() {
  initializeSlides();
  initializeEventListeners();
  animate();
}


function navigateWithZoom(container, url) {
  if (state.isMoving) { // evita click mentre si muove
    window.location.href = url;
    return;
  }

  // disabilita temporaneamente interazioni
  container.style.pointerEvents = "none";

  const tl = gsap.timeline({
    defaults: { duration: 0.18, ease: "power2.out" },
    onComplete: () => { window.location.href = url; }
  });

  // piccolo “pop” (1 -> 1.04 -> 1)
  tl.to(container, { scale: 1.04 })
    .to(container, { scale: 1.0 }, "+=0.02");
}

document.addEventListener("DOMContentLoaded", initializeSlider);


// --- PAGE TRANSITION: utils ---
function getTransitionEl() {
  return document.getElementById("page-transition");
}

function coverFromPoint(x, y, onComplete) {
  const el = getTransitionEl();
  if (!el) { onComplete?.(); return; }
  el.style.setProperty("--pt-x", `${x}px`);
  el.style.setProperty("--pt-y", `${y}px`);
  gsap.set(el, { opacity: 1, clipPath: "circle(0% at var(--pt-x) var(--pt-y))" });
  gsap.to(el, {
    duration: 0.45,
    ease: "power2.in",
    clipPath: "circle(150vmax at var(--pt-x) var(--pt-y))",
    onComplete
  });
}

function revealToPoint(x, y, onComplete) {
  const el = getTransitionEl();
  if (!el) { onComplete?.(); return; }
  el.style.setProperty("--pt-x", `${x}px`);
  el.style.setProperty("--pt-y", `${y}px`);
  gsap.set(el, { opacity: 1, clipPath: "circle(150vmax at var(--pt-x) var(--pt-y))" });
  gsap.to(el, {
    duration: 0.45,
    ease: "power3.out",
    clipPath: "circle(0% at var(--pt-x) var(--pt-y))",
    onComplete: () => {
      gsap.set(el, { opacity: 0 });
      onComplete?.();
    }
  });
}

function runEnterTransitionIfAny() {
  try {
    const x = sessionStorage.getItem("pt:x");
    const y = sessionStorage.getItem("pt:y");
    if (x && y) {
      sessionStorage.removeItem("pt:x");
      sessionStorage.removeItem("pt:y");
      revealToPoint(parseFloat(x), parseFloat(y));
    }
  } catch {}
}

// esegui l’enter transition quando il DOM è pronto
document.addEventListener("DOMContentLoaded", runEnterTransitionIfAny);

// 👇 QUI AGGIUNGI IL LISTENER PER PAGESHOW
window.addEventListener("pageshow", (e) => {
  if (e.persisted) {
    const el = getTransitionEl();
    if (el) gsap.set(el, { opacity: 0, clipPath: "circle(0% at 50% 50%)" });
  }
});

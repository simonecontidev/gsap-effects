// Register GSAP TextPlugin for animated text updates
gsap.registerPlugin(TextPlugin);

// Create a GSAP timeline with default easing
const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

// Loader counter and ring setup
const counterEl = document.querySelector(".counter");
const ringEl = document.querySelector(".loader .fg"); // loader progress ring
const ringLen = 2 * Math.PI * 52; // circumference of the ring
gsap.set(ringEl, { strokeDasharray: ringLen, strokeDashoffset: ringLen });

// Split the title text into span elements (so we can animate letters individually)
const title = document.querySelector(".title");
title.innerHTML = "";
[..."Hi"].forEach(ch => {
  const span = document.createElement("span");
  span.className = "char";
  span.textContent = ch;
  title.appendChild(span);
});
const chars = document.querySelectorAll(".char");

// === Loader timeline ===

// Animate the counter from 0% to 100%
// At the same time, animate the strokeDashoffset of the ring (progress effect)
tl.to({ p: 0 }, {
  duration: 2,
  p: 100,
  ease: "power2.out",
  onUpdate: function () {
    const val = Math.round(this.targets()[0].p);
    counterEl.textContent = val + "%"; // update text
    const offset = ringLen * (1 - val / 100);
    ringEl.style.strokeDashoffset = offset; // update ring progress
  }
}, 0);

// Animate the slit rectangle expanding
tl.to(".slit", {
  width: "80vw",
  height: "40vh",
  duration: 1.2,
  ease: "power3.inOut"
}, 0.6);

// Hide the loader with a clip-path wipe
tl.to(".loader", {
  duration: 1,
  ease: "power3.in",
  clipPath: "inset(0% 0% 100% 0%)"
}, 2);

// Reveal the hero container by removing blur and scaling it up
// Then animate each character of the title with a staggered entrance
tl.to(".container", {
  filter: "blur(0px) saturate(1)",
  scale: 1,
  duration: 1
}, 2.2).to(chars, {
  duration: 0.7,
  opacity: 1,
  y: 0,
  rotate: 0,
  scale: 1,
  stagger: 0.08,
  ease: "power3.out"
}, 2.3);

// Show the brand badge after the intro
tl.to(".brand-badge", {
  opacity: 1,
  duration: 0.8,
  ease: "power2.out"
}, 3);

// === Skip intro logic ===
let skipped = false;
const skip = () => {
  if (skipped) return;
  skipped = true;

  // Jump timeline to the end and kill it
  tl.progress(1).kill();

  // Forcefully hide loader and reveal content instantly
  document.querySelector(".loader").style.display = "none";
  gsap.set(".container", { clearProps: "all" });
  gsap.set(chars, { clearProps: "all", opacity: 1 });
  gsap.set(".brand-badge", { opacity: 1 });
};

// Allow skipping with key press or click
window.addEventListener("keydown", skip, { once: true });
window.addEventListener("click", skip, { once: true });

// === Brand badge behavior ===
// Compact badge (only ring) when scrolling into section #about
const brandBadge = document.getElementById("brandBadge");
const aboutSection = document.getElementById("about");

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      brandBadge.classList.add("compact");  // show only the circle
    } else {
      brandBadge.classList.remove("compact"); // show full "C ○ mpany Name"
    }
  });
}, { root: null, threshold: 0.25 });

io.observe(aboutSection);

// Accessibility: allow focus + keyboard interaction on the ring
const brandRingBtn = document.getElementById("brandRing");
brandRingBtn.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    // Optional: could open a menu, about modal, etc.
    e.preventDefault();
  }
});
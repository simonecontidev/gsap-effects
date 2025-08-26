gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   1) DATA: titles, descriptions, images
   - This array is the single source of truth.
   - Each object generates a <section> with text
     and a fixed preview image with animations.
========================================================= */
const slides = [
  { title: "Title 01", desc: "A short description of Title 01",
    img: "https://images.pexels.com/photos/1862695/pexels-photo-1862695.jpeg" },
  { title: "Title 02", desc: "A short description of Title 02",
    img: "https://images.pexels.com/photos/136740/pexels-photo-136740.jpeg" },
  { title: "Title 03", desc: "A short description of Title 03",
    img: "https://images.pexels.com/photos/450038/pexels-photo-450038.jpeg" },
  { title: "Title 04", desc: "A short description of Title 04",
    img: "https://images.pexels.com/photos/322483/pexels-photo-322483.jpeg" },
  { title: "Title 05", desc: "A short description of Title 05",
    img: "https://images.pexels.com/photos/28748513/pexels-photo-28748513.jpeg" },
  { title: "Title 06", desc: "A short description of Title 06",
    img: "https://images.pexels.com/photos/1869961/pexels-photo-1869961.jpeg" },
  { title: "Title 07", desc: "A short description of Title 07",
    img: "https://images.pexels.com/photos/1165082/pexels-photo-1165082.jpeg" }
];

/* =========================================================
   2) DOM BUILD: generate sections and previews
   - Loops over the slides array
   - Creates <section> for each slide (title + description)
   - Creates matching fixed preview <div> with <img>
========================================================= */
const headersContainer = document.getElementById("headers");
const previewsContainer = document.getElementById("section-previews");

slides.forEach((slide, i) => {
  const index = i + 1;

  // Section with title + description
  const section = document.createElement("section");
  section.id = `section-${index}`;
  const h1 = document.createElement("h1");
  h1.className = "headline";
  h1.textContent = slide.title;
  const p = document.createElement("p");
  p.className = "desc";
  p.textContent = slide.desc;

  section.appendChild(h1);
  section.appendChild(p);
  headersContainer.appendChild(section);

  // Preview container with image
  const wrap = document.createElement("div");
  wrap.className = "img";
  wrap.id = `preview-${index}`;

  const img = document.createElement("img");
  img.src = slide.img;
  img.alt = slide.title;

  wrap.appendChild(img);
  previewsContainer.appendChild(wrap);
});

// Add final spacer to allow last section to scroll fully
const spacer = document.createElement("div");
spacer.className = "spacer";
headersContainer.appendChild(spacer);

/* =========================================================
   3) UTILITY: splitText
   - Splits text into <span> elements
   - Mode "chars": wrap each character
   - Mode "words": wrap each word (spaces preserved)
   - Enables staggered animations with GSAP
========================================================= */
function splitText(el, mode = "chars") {
  if (!el) return [];
  const text = el.textContent;
  el.textContent = "";
  const frag = document.createDocumentFragment();

  if (mode === "words") {
    // Split text by words, preserving spaces
    text.split(/(\s+)/).forEach(token => {
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = token;
      frag.appendChild(span);
    });
    el.appendChild(frag);
    return el.querySelectorAll(".word");
  } else {
    // Split text by characters
    [...text].forEach(ch => {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = ch;
      frag.appendChild(span);
    });
    el.appendChild(frag);
    return el.querySelectorAll(".char");
  }
}

/* =========================================================
   4) TEXT ANIMATIONS (titles + descriptions)
   - Split headline into characters
   - Split description into words
   - Animate in when section enters viewport
   - Only runs once per section
========================================================= */
function initTextAnimations() {
  slides.forEach((_, i) => {
    const index = i + 1;
    const section = document.querySelector(`#section-${index}`);
    const h1 = section.querySelector(".headline");
    const desc = section.querySelector(".desc");

    // Split into chars/words
    const chars = splitText(h1, "chars");
    const words = splitText(desc, "words");

    // Initial hidden state
    gsap.set(chars, { yPercent: 120, opacity: 0 });
    gsap.set(words, { yPercent: 60, opacity: 0 });

    // Animate when section enters viewport
    ScrollTrigger.create({
      trigger: section,
      start: "top 60%",
      once: true,
      onEnter: () => {
        // Animate headline chars
        gsap.to(chars, {
          yPercent: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          stagger: { each: 0.015, from: "center" }
        });
        // Animate description words
        gsap.to(words, {
          yPercent: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: { each: 0.03, from: 0 },
          delay: 0.05
        });
      }
    });
  });
}

/* =========================================================
   5) IMAGE SCALE ANIMATION
   - Each preview image scales up (to 3x)
     while its corresponding section is in view
   - First section starts at "top top"
   - Subsequent sections start at "bottom bottom"
========================================================= */
function addImageScaleAnimation() {
  const sections = gsap.utils.toArray("section");
  sections.forEach((section, index) => {
    const imageEl = document.querySelector(`#preview-${index + 1} img`);
    if (!imageEl) return;

    const startCondition = index === 0 ? "top top" : "bottom bottom";

    gsap.to(imageEl, {
      scrollTrigger: {
        trigger: section,
        start: startCondition,
        end: () => {
          // Dynamic end value based on section + viewport
          const viewportHeight = window.innerHeight;
          const sectionBottom = section.offsetTop + section.offsetHeight;
          const additionalDistance = viewportHeight * 0.5;
          const endValue = sectionBottom - viewportHeight + additionalDistance;
          return `+=${endValue}`;
        },
        scrub: 1
      },
      scale: 3,
      ease: "none"
    });
  });
}

/* =========================================================
   6) PREVIEW CLIP-PATH TRANSITIONS
   - Uses CSS clip-path to reveal the current image
     and hide the previous one
   - Creates a wipe-like effect when scrolling between sections
========================================================= */
function animateClipPath(
  sectionId,
  previewId,
  startClipPath,
  endClipPath,
  start = "top center",
  end = "bottom top"
) {
  const section = document.querySelector(sectionId);
  const preview = document.querySelector(previewId);
  if (!section || !preview) return;

  ScrollTrigger.create({
    trigger: section,
    start,
    end,
    onEnter: () => {
      gsap.to(preview, {
        scrollTrigger: {
          trigger: section,
          start,
          end,
          scrub: 0.125
        },
        clipPath: endClipPath,
        ease: "none"
      });
    }
  });
}

function wireClipPath() {
  const totalSections = document.querySelectorAll("section").length;

  // First reveal (open first preview)
  animateClipPath(
    "#section-1",
    "#preview-1",
    "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
    "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
  );

  // From second section onwards: close previous, open current
  for (let i = 2; i <= totalSections; i++) {
    const currentSection = `#section-${i}`;
    const prevPreview = `#preview-${i - 1}`;
    const currentPreview = `#preview-${i}`;

    // Close previous preview
    animateClipPath(
      currentSection,
      prevPreview,
      "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      "top bottom",
      "center center"
    );

    // Open current preview
    animateClipPath(
      currentSection,
      currentPreview,
      "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
      "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      "center center",
      "bottom top"
    );
  }
}

/* =========================================================
   7) INIT
   - Initializes all animations
   - Refreshes ScrollTrigger on resize or font load
========================================================= */
initTextAnimations();
addImageScaleAnimation();
wireClipPath();

// Refresh ScrollTrigger calculations on resize or when fonts are ready
window.addEventListener("resize", () => ScrollTrigger.refresh());
document.fonts && document.fonts.ready && document.fonts.ready.then(() => ScrollTrigger.refresh());
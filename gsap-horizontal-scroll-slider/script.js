  let target = 0;
  let current = 0;
  let ease = 0.075;

  const slider = document.querySelector(".slider");
  const sliderWrapper = document.querySelector(".slider-wrapper");
  const markerWrapper = document.querySelector(".marker-wrapper");
  const activeSlide = document.querySelector(".active-slide");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const slideTitle = document.querySelector(".slide-title");

  // calcolo dimensioni dinamiche
  let maxScroll = 0;
  let slideStride = 0; // larghezza slide + gap

  function computeMetrics() {
    maxScroll = Math.max(0, sliderWrapper.offsetWidth - window.innerWidth);

    const style = getComputedStyle(sliderWrapper);
    const gap = parseFloat(style.gap || 0);

    // Prendiamo la prima slide come riferimento per la “larghezza unità”
    const ref = slides[0];
    const w = ref ? ref.offsetWidth : 0;
    slideStride = w + gap;
  }
  computeMetrics();

  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function updateActiveSlideNumber(markerMove, markerMaxMove) {
    const partWidth = markerMaxMove / 10;
    let currentPart = Math.round((markerMove - 70) / partWidth) + 1;
    currentPart = Math.min(10, Math.max(1, currentPart));
    activeSlide.textContent = `${currentPart}/10`;
  }

  // Effetto 3: profondità dinamica (scala/opacity in base alla distanza dal centro)
  function applyDepthEffects() {
    const viewportCenter = window.innerWidth / 2;

    slides.forEach((slide) => {
      const rect = slide.getBoundingClientRect();
      const slideCenter = rect.left + rect.width / 2;
      const dist = Math.abs(slideCenter - viewportCenter);

      // normalizziamo 0..1 circa
      const t = clamp(dist / (window.innerWidth * 0.6), 0, 1);

      // valori: più vicino al centro => scale ~1.05, opacity ~1
      const scale = 1.05 - 0.1 * t;     // 1.05 -> 0.95
      const opacity = 1 - 0.45 * t;     // 1 -> 0.55

      slide.style.transform = `scale(${scale})`;
      slide.style.opacity = opacity;



        // --- Mostra titolo solo per la slide sulla linea ---
  let active = null;
  const markerX = markerWrapper.getBoundingClientRect().left + markerWrapper.offsetWidth / 2;

  slides.forEach((slide) => {
    const rect = slide.getBoundingClientRect();
    const slideCenter = rect.left + rect.width / 2;

    // se il centro della slide è entro 40px dalla linea, è quella attiva
    if (Math.abs(slideCenter - markerX) < 40) {
      active = slide;
    }
  });

  if (active) {
    slideTitle.textContent = active.dataset.title || "";
    slideTitle.style.opacity = 1;
  } else {
    slideTitle.style.opacity = 0;
  }
    });
  }

  function update() {
    current = lerp(current, target, ease);

    gsap.set(".slider-wrapper", { x: -current });

    const moveRatio = maxScroll === 0 ? 0 : current / maxScroll;

    const markerMaxMove = window.innerWidth - markerWrapper.offsetWidth - 170;
    const markerMove = 70 + moveRatio * markerMaxMove;
    gsap.set(".marker-wrapper", { x: markerMove });

    updateActiveSlideNumber(markerMove, markerMaxMove);
    applyDepthEffects();

    requestAnimationFrame(update);
  }

  // Effetto 1: Snap-to-slide (al termine di interazioni “forti”)
  function snapToNearest() {
    if (slideStride <= 0) return;
    const idx = Math.round(target / slideStride);
    target = clamp(idx * slideStride, 0, maxScroll);
  }

  // Wheel
  let wheelTimeout;
  window.addEventListener("wheel", (e) => {
    target += e.deltaY;
    target = clamp(target, 0, maxScroll);

    // quando l'utente smette di scrollare, snap
    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(snapToNearest, 90);
  }, { passive: true });

  // Effetto 2: Drag/Touch
  let isDown = false;
  let startX = 0;
  let startTarget = 0;

  function onPointerDown(clientX) {
    isDown = true;
    startX = clientX;
    startTarget = target;
  }
  function onPointerMove(clientX) {
    if (!isDown) return;
    const dx = clientX - startX;
    target = clamp(startTarget - dx, 0, maxScroll);
  }
  function onPointerUp() {
    if (!isDown) return;
    isDown = false;
    snapToNearest();
  }

  // mouse
  slider.addEventListener("mousedown", (e) => onPointerDown(e.clientX));
  window.addEventListener("mousemove", (e) => onPointerMove(e.clientX));
  window.addEventListener("mouseup", onPointerUp);

  // touch
  slider.addEventListener("touchstart", (e) => onPointerDown(e.touches[0].clientX), { passive: true });
  window.addEventListener("touchmove", (e) => onPointerMove(e.touches[0].clientX), { passive: true });
  window.addEventListener("touchend", onPointerUp);

  // Keyboard (bonus)
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      target = clamp(target + slideStride, 0, maxScroll);
      snapToNearest();
    }
    if (e.key === "ArrowLeft") {
      target = clamp(target - slideStride, 0, maxScroll);
      snapToNearest();
    }
  });

  window.addEventListener("resize", () => {
    computeMetrics();
    // ri-clampa su nuove dimensioni
    target = clamp(target, 0, maxScroll);
  });

  update();
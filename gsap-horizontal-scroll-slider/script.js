// Everything runs after DOMContentLoaded. We also guard for GSAP availability.
    window.addEventListener("DOMContentLoaded", () => {
      const boot = () => {
        if (!window.gsap) {
          console.error("GSAP failed to load. Check the CDN.");
          return;
        }

        // --- State & References ------------------------------------------------
        let target = 0,        // desired scroll position (in px along the X axis)
            current = 0,       // interpolated scroll position (for smooth lerp)
            ease = 0.075,      // lerp factor (higher = snappier)
            maxScroll = 0,     // max horizontal scroll (contentWidth - viewportWidth)
            slideStride = 0,   // width of one "step": slide width + gap
            animating = false; // RAF loop flag (saves CPU when idle)

        const slider        = document.querySelector(".slider");
        const sliderWrapper = document.querySelector(".slider-wrapper");
        const markerWrapper = document.querySelector(".marker-wrapper");
        const counterCurrent= document.querySelector(".counter .current");
        const counterTotal  = document.querySelector(".counter .total");
        const slides        = Array.from(document.querySelectorAll(".slide"));
        const slideTitle    = document.querySelector(".slide-title");
        const prevBtn       = document.querySelector(".prev");
        const nextBtn       = document.querySelector(".next");

        counterTotal.textContent = String(slides.length);

        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // --- Utils -------------------------------------------------------------
        const lerp  = (a,b,t) => a + (b-a)*t;
        const clamp = (v,min,max) => Math.max(min, Math.min(max, v));

        // Recompute layout metrics (on load & resize)
        function computeMetrics(){
          const style = getComputedStyle(sliderWrapper);
          const gap = parseFloat(style.gap || 0);
          const ref = slides[0];
          const w = ref ? ref.offsetWidth : 0;
          slideStride = w + gap;
          maxScroll = Math.max(0, sliderWrapper.offsetWidth - window.innerWidth);
        }

        // Start/Stop RAF loop only when needed
        function startAnim(){
          if (animating) return;
          animating = true;
          requestAnimationFrame(tick);
        }
        function stopAnimIfIdle(){
          if (Math.abs(current - target) < 0.3) {
            animating = false; // stop RAF until the next input
          } else {
            requestAnimationFrame(tick);
          }
        }

        // Update the x/N counter near the marker
        function updateCounter(markerMove, markerMaxMove){
          const total = slides.length;
          const partWidth = markerMaxMove > 0 ? markerMaxMove / total : 1;
          let currentPart = Math.round((markerMove - 70) / partWidth) + 1;
          currentPart = clamp(currentPart, 1, total);
          counterCurrent.textContent = String(currentPart);
        }

        // Depth/opacity effect + compute which slide is intersected by the marker
        function applyDepthEffectsFast(){
          if (prefersReduced) {
            slides.forEach(slide => { slide.style.transform = "none"; slide.style.opacity = "1"; });
            slideTitle.style.opacity = 0;
            return;
          }

          const viewportCenter = window.innerWidth / 2;
          const idx = slideStride > 0 ? Math.round(target / slideStride) : 0;

          // markerX is the vertical line X coordinate (center of the marker block)
          const markerX = markerWrapper.getBoundingClientRect().left + markerWrapper.offsetWidth / 2;

          let active = null; // the slide currently intersected by the marker

          slides.forEach((slide, i) => {
            const isNear = Math.abs(i - idx) <= 2; // limit work for performance

            if (!isNear) {
              // More opacity at the edges (distant slides)
              slide.style.transform = "scale(0.94)";
              slide.style.opacity = "0.40";
              return;
            }

            const rect = slide.getBoundingClientRect();
            const slideCenter = rect.left + rect.width / 2;
            const dist = Math.abs(slideCenter - viewportCenter);
            const t = clamp(dist / (window.innerWidth * 0.6), 0, 1);

            const scale = 1.06 - 0.12 * t; // slightly larger near center
            const opacity = 1 - 0.65 * t;  // fade towards edges
            slide.style.transform = `scale(${scale})`;
            slide.style.opacity = opacity;

            // We consider the slide "active" if the marker's X falls within its bounds
            if (rect.left <= markerX && markerX <= rect.right) {
              active = slide;
            }
          });

          // Animate title visibility with GSAP (fade in/out + subtle Y motion)
          if (active) {
            slideTitle.textContent = active.dataset.title || "";
            gsap.to(slideTitle, {
              opacity: 1,
              y: 0,
              duration: 0.4,
              ease: "power2.out"
            });
          } else {
            gsap.to(slideTitle, {
              opacity: 0,
              duration: 0.3,
              ease: "power2.in"
            });
          }
        }

        // --- Circular progress ring setup (stroke-dashoffset trick) ------------
        const progressCircle = markerWrapper.querySelector('.marker-circle .progress');
        const R = 18;                  // radius used in the SVG
        const C = 2 * Math.PI * R;     // circumference
        progressCircle.setAttribute('stroke-dasharray', C);
        progressCircle.setAttribute('stroke-dashoffset', C); // start "empty"

        // --- Main RAF loop -----------------------------------------------------
        function tick(){
          // Smoothly interpolate "current" towards "target"
          current = lerp(current, target, ease);

          // Apply horizontal translation to the wrapper
          gsap.set(sliderWrapper, { x: -current });

          // Compute scroll ratio (0..1) for UI elements (counter, progress)
          const moveRatio = maxScroll === 0 ? 0 : current / maxScroll;

          // Draw the progress ring around the marker (0..360 degrees)
          progressCircle.setAttribute('stroke-dashoffset', C * (1 - moveRatio));

          // Move the marker block along X proportionally to scroll
          const rawMax = window.innerWidth - markerWrapper.offsetWidth - 170;
          const markerMaxMove = Math.max(0, rawMax);
          const markerMove = 70 + moveRatio * markerMaxMove;
          gsap.set(markerWrapper, { x: markerMove });

          // Update the x/N counter and depth effects
          updateCounter(markerMove, markerMaxMove);
          applyDepthEffectsFast();

          // Continue or stop the RAF loop depending on how close we are to "target"
          stopAnimIfIdle();
        }

        // Snap to the nearest slide (called after strong inputs: wheel/keys/drag end)
        function snapToNearest(){
          if (slideStride <= 0) return;
          const idx = Math.round(target / slideStride);
          target = clamp(idx * slideStride, 0, maxScroll);
          startAnim();
        }

        // --- Input handling ----------------------------------------------------

        // Wheel scrolling: accumulate deltaY into the "target" and snap after a pause
        let wheelTimeout;
        window.addEventListener("wheel", (e) => {
          target = clamp(target + e.deltaY, 0, maxScroll);
          startAnim();
          clearTimeout(wheelTimeout);
          wheelTimeout = setTimeout(snapToNearest, 90);
        }, { passive: true });

        // Drag / Touch to scrub horizontally
        let isDown = false, startX = 0, startTarget = 0;

        function onPointerDown(x){
          isDown = true;
          document.body.classList.add("dragging");
          slider.classList.add("dragging");
          startX = x; startTarget = target;
        }
        function onPointerMove(x){
          if (!isDown) return;
          const dx = x - startX;
          target = clamp(startTarget - dx, 0, maxScroll);
          startAnim();
        }
        function onPointerUp(){
          if (!isDown) return;
          isDown = false;
          document.body.classList.remove("dragging");
          slider.classList.remove("dragging");
          snapToNearest();
        }

        slider.addEventListener("mousedown", e => onPointerDown(e.clientX));
        window.addEventListener("mousemove", e => onPointerMove(e.clientX));
        window.addEventListener("mouseup", onPointerUp);

        slider.addEventListener("touchstart", e => onPointerDown(e.touches[0].clientX), { passive: true });
        window.addEventListener("touchmove", e => onPointerMove(e.touches[0].clientX), { passive: true });
        window.addEventListener("touchend", onPointerUp);

        // Keyboard navigation + hover controls
        function step(n){
          target = clamp(target + n * slideStride, 0, maxScroll);
          snapToNearest();
        }
        window.addEventListener("keydown", (e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft")  step(-1);
          if (e.key === "Home") { target = 0;        snapToNearest(); }
          if (e.key === "End")  { target = maxScroll; snapToNearest(); }
        });
        prevBtn?.addEventListener("click", () => step(-1));
        nextBtn?.addEventListener("click", () => step(1));

        // --- Lifecycle: metrics & observers -----------------------------------
        function afterAssetsReady(){
          computeMetrics();
          snapToNearest();
        }
        window.addEventListener("load", afterAssetsReady);

        const ro = new ResizeObserver(() => {
          computeMetrics();
          target = clamp(target, 0, maxScroll);
        });
        ro.observe(sliderWrapper);

        // Initial compute + start RAF
        computeMetrics();
        startAnim();
      };

      if (document.readyState === "complete" || document.readyState === "interactive") {
        boot();
      } else {
        window.addEventListener("load", boot);
      }
    });
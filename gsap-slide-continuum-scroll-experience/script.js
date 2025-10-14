 /* ===== Config: how long (percentage of first slide width) the intro runs ===== */
    const INTRO_THRESHOLD = 0.15; // e.g. 0.12 shorter, 0.30 longer

    /* Split an h2 into multiple "line" spans (simple and dependency-free) */
    function splitLines(el){
      if(!el) return;
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = "";
      let line = document.createElement("span");
      line.className = "line";
      let count = 0;
      for(let i=0;i<words.length;i++){
        const w = document.createTextNode(words[i] + (i<words.length-1?" ":""));
        line.appendChild(w);
        count += words[i].length + 1;
        if(count > 26 || i===words.length-1){
          el.appendChild(line);
          line = document.createElement("span");
          line.className = "line";
          count = 0;
        }
      }
    }

    document.addEventListener("DOMContentLoaded", () => {
      gsap.registerPlugin(ScrollTrigger);

      // Smooth scrolling (desktop + mobile)
      const lenis = new Lenis({ smoothWheel: true, smoothTouch: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t)=>lenis.raf(t*1000));
      gsap.ticker.lagSmoothing(0);

      const sticky = document.querySelector(".sticky");
      const slider = document.querySelector(".slider");
      const sc     = document.querySelector(".slides");
      const slides = gsap.utils.toArray(".slide");

      // Horizontal width (100vw * number of slides)
      sc.style.width = `${slides.length * 100}vw`;

      // Collect elements per slide
      const titles   = slides.map(s=>s.querySelector(".title h1"));
      const eyebrows = slides.map(s=>s.querySelector(".content .eyebrow"));
      const paras    = slides.map(s=>s.querySelector(".content p"));
      const actions  = slides.map(s=>s.querySelector(".content .actions"));
      const inners   = slides.map(s=>s.querySelector(".slide-inner"));

      // Prepare h2 split lines
      const linesBySlide = [];
      slides.forEach((s, i)=>{
        const h2 = s.querySelector(".content h2");
        splitLines(h2);
        linesBySlide[i] = s.querySelectorAll(".line");
      });

      // Initial states
      gsap.set(titles, { y: -200 });
      linesBySlide.forEach(lines => gsap.set(lines, { y: 120, opacity: 0 }));
      gsap.set([eyebrows, paras, actions].flat(), { y: 24, opacity: 0 });

      // Per-slide content timelines
      const tls = slides.map((s, i)=>{
        const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
        tl.to(eyebrows[i],      { opacity: 1, y: 0, duration: .45 }, 0.05)
          .to(linesBySlide[i],  { opacity: 1, y: 0, duration: .55, stagger: 0.08 }, 0.12)
          .to(paras[i],         { opacity: 1, y: 0, duration: .50 }, 0.28)
          .to(actions[i],       { opacity: 1, y: 0, duration: .45 }, 0.34);
        return tl;
      });

      function setup(){
        // Kill previous ScrollTriggers (keep Lenis alive)
        ScrollTrigger.getAll().forEach(st => st.kill());

        const slideW     = slider.clientWidth;
        const totalMove  = Math.max(0, sc.scrollWidth - slideW);
        const epsilon    = 1; // tiny extra px to fully reach last slide
        const isMobile   = window.innerWidth < 768;
        const mediaScale = isMobile ? 1.6 : 1.35;
        const parallaxFactor = 0.25;

        // Horizontal scroll
        gsap.to(sc, {
          x: () => -(totalMove),
          ease: "none",
          scrollTrigger: {
            trigger: sticky,
            start: "top top",
            end: () => "+=" + (totalMove + epsilon),
            scrub: 1,
            pin: true,
            pinSpacing: true,
            pinType: "transform",
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const mainMove = -gsap.getProperty(sc, "x");
              const clamped  = Math.min(mainMove, totalMove);
              const current  = Math.min(slides.length - 1, Math.floor(clamped / slideW));
              const sProg    = (clamped % slideW) / slideW;

              // Parallax (supports <img> and <video>)
              slides.forEach((slide, idx)=>{
                const media = slide.querySelector(".media img, .media video");
                if(!media) return;
                const maxShift = ((mediaScale - 1) / 2) * slideW * 0.98;
                if(idx === current || idx === current + 1){
                  const rel = idx === current ? sProg : sProg - 1;
                  let shift = rel * slideW * parallaxFactor;
                  shift = Math.max(-maxShift, Math.min(maxShift, shift));
                  gsap.set(media, { x: shift, scale: mediaScale });
                } else {
                  gsap.set(media, { x: 0, scale: mediaScale });
                }
              });

              // Big headline (H1)
              titles.forEach((t, i)=>{
                const visible = (i === current) || (i === current + 1 && sProg > 0.5);
                gsap.to(t, { y: visible ? 0 : -200, duration: .35, ease: "power2.out", overwrite: true });
              });

              // Content timelines
              const active = (sProg > 0.5) ? Math.min(current + 1, slides.length - 1) : current;
              tls.forEach((tl, i)=>{
                if(i === active){ if (tl.reversed() || !tl.isActive()) tl.play(); }
                else { if (!tl.reversed()) tl.reverse(); }
              });

              // Intro (first slide): full-bleed -> boxed + frame growth
              const introInner = inners[0];
              if (introInner) {
                const introP = Math.max(0, Math.min(1, (clamped / slideW) / INTRO_THRESHOLD)); // 0..1
                const root   = getComputedStyle(document.documentElement);
                const basePad = parseFloat(root.getPropertyValue('--base-pad')) || 32;
                const frameYFinal = parseFloat(root.getPropertyValue('--frameY-final')) || 24;
                introInner.style.setProperty('--pad',    (introP * basePad) + 'px');
                introInner.style.setProperty('--frameY', (introP * frameYFinal) + 'px');
              }
            }
          }
        });

        // Slide snapping
        ScrollTrigger.create({
          trigger: sticky,
          start: "top top",
          end: () => "+=" + (totalMove + epsilon),
          scrub: 1,
          snap: {
            snapTo: (v) => {
              const steps = slides.length - 1;
              return Math.round(v * steps) / steps;
            },
            duration: { min: 0.1, max: 0.3 },
            ease: "power1.out",
            clamp: true
          }
        });
      }

      setup();

      // Robust refresh
      const refresh = (()=>{ let t; return ()=>{ clearTimeout(t); t = setTimeout(()=>{ sc.style.width = `${slides.length*100}vw`; ScrollTrigger.refresh(); }, 150); }; })();
      window.addEventListener("resize", refresh, { passive: true });
      window.addEventListener("orientationchange", () => setTimeout(()=>ScrollTrigger.refresh(), 250), { passive: true });
    });
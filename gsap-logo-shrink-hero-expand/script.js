    gsap.registerPlugin(ScrollTrigger);

    // Defaults for smoother feel
    gsap.defaults({ ease: "power3.out" });

    // Intro text reveal (centered under the logo)
    const introEl = document.querySelector(".intro-copy");
    const original = introEl.textContent.trim();
    introEl.setAttribute("aria-label", original);
    introEl.innerHTML = original.split("").map(ch => {
      const safe = ch === " " ? "&nbsp;" : ch;
      return `<span class="reveal-char">${safe}</span>`;
    }).join("");

    gsap.to(".reveal-char", {
      y: "0%",
      opacity: 1,
      duration: 0.9,
      ease: "expo.out",
      stagger: { each: 0.014, from: "start" }
    });

    // Logo shrink on scroll — ends perfectly centered in the navbar
    gsap.timeline({
      scrollTrigger: {
        trigger: ".intro",
        start: "top top",
        end: "bottom top",
        scrub: 0.6        // smoother
      }
    })
    .fromTo(".logo",
      { y: "42vh", scale: 4.8, opacity: 0.98, letterSpacing: ".14em" },
      { y: 0,        scale: 1,   opacity: 1,   letterSpacing: ".05em", ease: "none" } // ease none + scrub = butter
    );

    // HERO expand + overlay + title reveal while pinned
    const heroTL = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero__inner",
        start: "top top",
        end: "+=140%",  // a bit longer for smoother growth
        scrub: 0.6,
        pin: true,
        anticipatePin: 1
      }
    });

    heroTL
      .fromTo(".hero__img",
        { scale: 1, borderRadius: "16px", width: "min(85vw, 1200px)" },
        {
          scale: 1.12,
          borderRadius: "0px",
          width: "100vw",
          ease: "none"    // with scrub, 'none' feels smooth
        },
        0
      )
      .fromTo(".hero__overlay",
        { background: "rgba(0,0,0,0)" },
        { background: "rgba(0,0,0,.38)", ease: "none" },
        0.08
      )
      .to(".hero__title", { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.35);

    // Menu hover effect — simple & smooth (no RAF)
    const links = document.querySelectorAll(".nav a");
    links.forEach(link => {
      const tl = gsap.timeline({ paused: true, defaults:{ duration: .28, ease: "expo.out" } });
      tl.to(link, { skewX: -6, y: -1, color: "var(--brand)" }, 0);

      link.addEventListener("mouseenter", () => {
        tl.play();
        gsap.to(link, { "--u": 1, duration: .32, ease: "expo.out" }); // underline grow
      });
      link.addEventListener("mouseleave", () => {
        tl.reverse();
        gsap.to(link, { "--u": 0, duration: .32, ease: "expo.out" }); // underline shrink
      });
    });

    // Refresh ScrollTrigger once the hero image is loaded (avoids pin jumps)
    const heroImg = document.querySelector(".hero__img");
    if (heroImg.complete) ScrollTrigger.refresh();
    else heroImg.addEventListener("load", () => ScrollTrigger.refresh());
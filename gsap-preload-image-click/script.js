 // -----------------------------
    // Custom Cursor (mix-blend-mode difference)
    // -----------------------------
    const cursor = document.createElement("div");
    cursor.classList.add("cursor");
    document.body.appendChild(cursor);

    // Smooth follow using gsap.quickTo (more performant than animating on every mousemove)
    const qtX = gsap.quickTo(cursor, "x", { duration: 0.15, ease: "power3.out" });
    const qtY = gsap.quickTo(cursor, "y", { duration: 0.15, ease: "power3.out" });

    document.addEventListener("mousemove", (e) => {
      qtX(e.clientX);
      qtY(e.clientY);
    });

    // Optional: subtle scale on mousedown/up for feedback
    window.addEventListener("mousedown", () => gsap.to(cursor, { scale: 0.85, duration: 0.12, ease: "power2.out" }));
    window.addEventListener("mouseup", () => gsap.to(cursor, { scale: 1, duration: 0.18, ease: "power2.out" }));

    // -----------------------------
    // Initial Text Entrance (overlay copy)
    // -----------------------------
    // Slide each line up with a rhythmic stagger
    gsap.from("h2 div", {
      yPercent: 100,
      opacity: 0,
      duration: 1.0,
      ease: "power3.out",
      stagger: 0.25
    });

    // Reveal the h2 clip-mask
    gsap.to("h2", {
      clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
      duration: 1.4,
      ease: "power4.inOut",
      stagger: { amount: 0.5 }
    });

    // -----------------------------
    // Image presets for smoother transforms
    // -----------------------------
    gsap.set(".img img", { willChange: "transform, filter" });

    document.addEventListener("DOMContentLoaded", () => {
      const overlay = document.querySelector(".overlay");

      // Subtle Ken Burns + random tilt while loader is visible (pre-anim)
      document.querySelectorAll(".img img").forEach((el, i) => {
        gsap.fromTo(el,
          { 
            scale: 1.05,
            xPercent: gsap.utils.random(-3, 3),
            yPercent: gsap.utils.random(-3, 3),
            rotate: gsap.utils.random(-2, 2)
          },
          { 
            scale: 1,
            xPercent: 0,
            yPercent: 0,
            rotate: 0,
            duration: 2.0,
            ease: "power2.out",
            delay: i * 0.15
          }
        );
      });

      overlay.addEventListener("click", () => {

        // --------------------------------
        // Light sweep across each image
        // We animate the CSS variable --shine-left from -75% to 125%
        // --------------------------------
        gsap.to(".img", {
          duration: 1.2,
          ease: "power2.inOut",
          stagger: { amount: 1.2 },
          "--shine-left": "125%"
        });

        // --------------------------------
        // Exit overlay text (slides up + fades + blur)
        // --------------------------------
        gsap.to("h2 div", {
          yPercent: -100,
          opacity: 0,
          filter: "blur(8px)",
          duration: 1.2,
          ease: "power4.inOut",
          stagger: { amount: 0.5 }
        });

        gsap.to("h2", {
          clipPath: "polygon(0 85%, 100% 85%, 100% 100%, 0% 100%)",
          duration: 1.2,
          ease: "power4.inOut",
          stagger: { amount: 0.5 }
        });

        // --------------------------------
        // Reveal the main page title after loader sequence
        // --------------------------------
        gsap.from(".container h1", {
          yPercent: 120,
          opacity: 0,
          duration: 1.5,
          ease: "power4.out",
          delay: 3 // after the loader closes
        });

        // --------------------------------
        // Close overlay mask
        // --------------------------------
        gsap.to(".overlay", {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
          duration: 1.5,
          ease: "power4.inOut"
        });

        // --------------------------------
        // Staggered image reveals via clip-path
        // --------------------------------
        gsap.to(".img", {
          clipPath: "polygon(0 100%, 100% 100%, 100% 0%, 0 0%)",
          duration: 1.6,
          ease: "power4.inOut",
          stagger: { amount: 1.2 }
        });

        // --------------------------------
        // Ken Burns (again on click) to reinforce cinematic feel
        // --------------------------------
        document.querySelectorAll(".img img").forEach((el, i) => {
          gsap.fromTo(el,
            { 
              scale: 1.05,
              xPercent: gsap.utils.random(-3, 3),
              yPercent: gsap.utils.random(-3, 3),
              rotate: gsap.utils.random(-2, 2)
            },
            { 
              scale: 1,
              xPercent: 0,
              yPercent: 0,
              rotate: 0,
              duration: 2.0,
              ease: "power2.out",
              delay: i * 0.15
            }
          );
        });

        // --------------------------------
        // Finally collapse the whole loader
        // --------------------------------
        gsap.to(".loader", {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
          duration: 1.6,
          ease: "power4.inOut",
          delay: 1.9
        });
      });
    });
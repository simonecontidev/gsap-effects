const { gsap } = window;

    // Hover text animation (play/reverse)
    document.querySelectorAll(".menu-item").forEach((item) => {
      const def = item.querySelector(".default");
      const hov = item.querySelector(".hover");
      gsap.set(def, { yPercent: 0 });
      gsap.set(hov, { yPercent: 100 });

      const tl = gsap.timeline({ paused: true, defaults: { duration: 0.45, ease: "expo.out" }});
      tl.to(def, { yPercent: -100 }, 0).to(hov, { yPercent: 0 }, 0);

      item.addEventListener("mouseenter", () => tl.play());
      item.addEventListener("mouseleave", () => tl.reverse());
    });

    // Preview image + description (stable)
    const preview = document.querySelector(".preview");
    const previewImg = preview.querySelector("img");
    const previewDesc = preview.querySelector("p");

    // Smooth positioning
    const setX = gsap.quickTo(preview, "x", { duration: 0.9, ease: "expo.out" });
    const setY = gsap.quickTo(preview, "y", { duration: 0.9, ease: "expo.out" });

    // Current box size (updated at runtime)
    let boxW = 300, boxH = 200;

    const clampTo800 = (w, h) => {
      const scale = Math.min(800 / w, 800 / h, 1);
      return { w: Math.round(w * scale), h: Math.round(h * scale) };
    };

    const preloadAndShow = (src, desc) => {
      const img = new Image();
      img.onload = () => {
        // calculate size and apply
        const { w, h } = clampTo800(img.naturalWidth || img.width, img.naturalHeight || img.height);
        boxW = w; boxH = h;
        preview.style.width = w + "px";
        previewImg.src = src;
        previewDesc.textContent = desc || "";

        // reset animation state
        gsap.set(preview, { scale: 0.95, rotate: -6 });
        gsap.set(previewDesc, { opacity: 0, y: 12 });

        // show
        gsap.to(preview, { opacity: 1, scale: 1, rotate: 0, duration: 0.4, ease: "expo.out" });
        gsap.to(previewDesc, { opacity: 1, y: 0, duration: 0.35, ease: "expo.out", delay: 0.12 });
      };
      img.onerror = () => {
        // safe fallback
        boxW = 320; boxH = 200;
        preview.style.width = boxW + "px";
        previewImg.removeAttribute("src");
        previewDesc.textContent = desc || "";
        gsap.to(preview, { opacity: 1, duration: 0.3 });
      };
      // Pexels sometimes requires params; add w=600 safe default
      const hasParams = src.includes("?");
      img.src = src + (hasParams ? "" : "?auto=compress&cs=tinysrgb&w=600&dpr=1");
    };

    const enter = (src, desc) => {
      preloadAndShow(src, desc);
    };

    const leave = () => {
      gsap.to(previewDesc, { opacity: 0, y: 12, duration: 0.2 });
      gsap.to(preview, { opacity: 0, scale: 0.98, rotate: -4, duration: 0.3, ease: "expo.inOut", delay: 0.05 });
    };

    const move = (e) => {
      // center the box relative to the mouse
      const targetX = e.clientX - boxW / 2;
      const targetY = e.clientY - (boxH / 2 + 20);
      setX(targetX);
      setY(targetY);
    };

    document.querySelectorAll(".menu-item").forEach((item) => {
      item.addEventListener("mouseenter", () => enter(item.dataset.img, item.dataset.desc));
      item.addEventListener("mouseleave", leave);
      item.addEventListener("mousemove", move);
    });
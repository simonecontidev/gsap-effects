  /* ==================== DATA ==================== */
  const artworks = [
    { id:1, title:"Lorem ipsum dolor sit amet.", numeral:"XII",
      src:"https://images.pexels.com/photos/12115308/pexels-photo-12115308.jpeg",
      alt:"Abstract portrait with warm tones", year:"2024", medium:"Acrylic on canvas", size:"80 × 120 cm",
      description:"Warm, layered strokes explore memory and presence in a tropical undertone." },
    { id:2, title:"Lorem ipsum dolor sit amet.", numeral:"XIV",
      src:"https://images.pexels.com/photos/6736556/pexels-photo-6736556.jpeg",
      alt:"Minimalist blue composition", year:"2023", medium:"Oil and pigment on wood", size:"60 × 90 cm",
      description:"A balanced field of blues collapses distance into intimate calm." },
    { id:3, title:"Lorem ipsum dolor sit amet.", numeral:"XV",
      src:"https://images.pexels.com/photos/32142962/pexels-photo-32142962.jpeg",
      alt:"Geometric shapes in motion", year:"2025", medium:"Mixed media", size:"100 × 100 cm",
      description:"Diagonal energies unfold like a silent choreography of light." },
    { id:4, title:"Lorem ipsum dolor sit amet.", numeral:"XXV",
      src:"https://images.pexels.com/photos/756856/pexels-photo-756856.jpeg",
      alt:"Monochrome architecture detail", year:"2022", medium:"Charcoal on cotton paper", size:"70 × 100 cm",
      description:"An edge between stone and shadow; a study in restraint." }
  ];

  /* ==================== GALLERY RENDER ==================== */
  const itemsEl = document.getElementById("items");

  // Render each artwork as a grid item
  itemsEl.innerHTML = artworks.map(({ id, title, numeral, src, alt }) => `
    <div class="item" data-id="${id}" role="group" aria-label="Artwork ${id}">
      <img src="${src}" alt="${alt}">
      <div class="img-overlay" aria-hidden="true"></div>
      <div class="item-copy">
        <div class="item-name">
          ${title}
          <span>${numeral}</span>
        </div>
        <div class="id">${id}</div>
      </div>
    </div>
  `).join("");

  /* ==================== HOVER TIMELINES (DESKTOP ONLY) ==================== */
  function initItemTimelines(){
    document.querySelectorAll('.item').forEach((el) => {
      const overlay = el.querySelector('.img-overlay');
      const img = el.querySelector('img');
      const title = el.querySelector('.item-name');
      const idEl = el.querySelector('.id');

      // Initial states
      gsap.set([title, idEl], { y: 30, opacity: 0 });
      gsap.set(img, { scale: 1.5 });
      gsap.set(overlay, { yPercent: 0 });

      // Hover timeline
      const tl = gsap.timeline({ paused: true, defaults:{ ease:'power3.out', duration:0.8 }});
      tl.to(overlay, { yPercent: -100 }, 0)
        .to(img, { scale: 1, duration: 1.1 }, 0)
        .to(title, { y: 0, opacity: 1 }, 0.1)
        .to(idEl, { y: 0, opacity: 1 }, 0.2);

      // Run hover animations only on non-touch devices
      const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
      if (!isTouch){
        el.addEventListener('mouseenter', () => tl.play());
        el.addEventListener('mouseleave', () => tl.reverse());
      }

      // Open detail overlay on click
      el.addEventListener('click', () => openDetail(Number(el.dataset.id)));

      // Keep a reference if needed later
      el._timeline = tl;
    });
  }
  initItemTimelines();

  /* ==================== IMMERSIVE DETAIL (SCOPED NODES) ==================== */
  const detail      = document.getElementById('detail');
  const detailImg   = detail.querySelector('.detail-img');
  const detailLayer = detail.querySelector('.detail-layer');
  const inner       = detail.querySelector('.detail-inner');

  const txtTitle = detail.querySelector('#detail-title');
  const txtMeta  = detail.querySelector('#detail-meta');
  const txtDesc  = detail.querySelector('#detail-desc');
  const txtId    = detail.querySelector('#detail-id');

  const btnClose = document.getElementById('detailClose');

  // Helper: reset initial states before every new reveal
  function primeDetailForReveal() {
    // Clear inline styles from previous animations
    gsap.set([detailLayer, detailImg, txtTitle, txtMeta, txtDesc, txtId], { clearProps: 'all' });

    // Prepare initial animation states
    gsap.set(detail,      { opacity: 1 });     // container stays visible, we fade it separately
    gsap.set(detailLayer, { opacity: 1 });
    gsap.set(detailImg,   { scale: 1.08, opacity: 0.6 });

    gsap.set([txtTitle, txtMeta, txtDesc, txtId], { opacity: 0, y: 20 });
  }

  // Open overlay with animations
  function openDetail(id){
    const art = artworks.find(a => a.id === id);
    if(!art) return;

    // Fill content dynamically
    detailImg.src = art.src;
    detailImg.alt = art.alt || art.title;
    txtTitle.textContent = art.title;
    txtMeta.textContent  = `${art.year} • ${art.medium} • ${art.size}`;
    txtDesc.textContent  = art.description || '';
    txtId.textContent    = art.id;

    // Show overlay
    detail.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');

    // Reset states before running animations
    primeDetailForReveal();

    // Entry animations
    gsap.fromTo(detail, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
    gsap.to(detailImg,  { scale: 1.02, opacity: 1, duration: 0.7, ease: 'power3.out' });

    const tl = gsap.timeline({ defaults:{ ease:'power3.out' }});
    tl.to(txtTitle, { y: 0, opacity: 1, duration: 0.5 }, 0.05)
      .to(txtMeta,  { y: 0, opacity: 1, duration: 0.45 }, 0.12)
      .to(txtDesc,  { y: 0, opacity: 1, duration: 0.45 }, 0.18)
      .to(txtId,    { y: 0, opacity: 0.95, duration: 0.5 }, 0.18);
  }

  // Close overlay with animations
  function closeDetail(){
    const tl = gsap.timeline({
      defaults:{ ease:'power2.inOut' },
      onComplete: () => {
        detail.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
        // Clean up inline styles to avoid “stuck” states on next open
        gsap.set([detailLayer, detailImg, txtTitle, txtMeta, txtDesc, txtId], { clearProps: 'all' });
      }
    });

    tl.to(detailLayer, { opacity: 0, duration: 0.2 }, 0)
      .to(detailImg,   { scale: 1.06, opacity: 0.6, duration: 0.25 }, 0)
      .to(detail,      { opacity: 0, duration: 0.22 }, 0.05);
  }

  // Close on background click / button / ESC key
  detail.addEventListener('click', (e) => {
    if (!inner.contains(e.target)) closeDetail();
  });
  btnClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeDetail();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && detail.getAttribute('aria-hidden') === 'false') {
      closeDetail();
    }
  });

  // Small "peek" animation for the first item on touch devices
  (function hintOnMobile(){
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (!isTouch) return;
    const first = document.querySelector('.item');
    if (first && first._timeline){
      setTimeout(() => {
        first._timeline.play();
        setTimeout(() => first._timeline.reverse(), 800);
      }, 300);
    }
  })();

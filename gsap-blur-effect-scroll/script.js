gsap.registerPlugin(ScrollTrigger);

/* ---------------------------
   1) Wrap words except .focus
   - Wraps each text node (not inside .focus) into <span class="fog">
   - Keeps whitespace and punctuation intact
---------------------------- */
function wrapWordsExceptFocus(rootEl, focusSelector = '.focus') {
  const el = typeof rootEl === 'string' ? document.querySelector(rootEl) : rootEl;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      // Skip nodes that are already inside a .focus element
      let p = node.parentElement;
      while (p && p !== el) {
        if (p.matches && p.matches(focusSelector)) return NodeFilter.FILTER_REJECT;
        p = p.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    const tokens = node.nodeValue.match(/(\s+|[^\s]+)/g) || [node.nodeValue];
    tokens.forEach(tok => {
      if (/^\s+$/.test(tok)) frag.appendChild(document.createTextNode(tok));
      else {
        const span = document.createElement('span');
        span.className = 'fog';
        span.textContent = tok;
        frag.appendChild(span);
      }
    });
    node.replaceWith(frag);
  });
}

/* ---------------------------
   2) Split into letters
   - Splits both .fog and .focus spans into <span class="char">
   - Preserves whitespace/punctuation
---------------------------- */
function splitToChars(scope) {
  const targets = scope.querySelectorAll('.fog, .focus');
  targets.forEach(node => {
    if (node.dataset.splitted) return; // skip if already split
    node.dataset.splitted = '1';

    const text = node.textContent;
    const frag = document.createDocumentFragment();
    const tokens = text.match(/(\s+|[^\s])/g) || [text];

    tokens.forEach(tok => {
      if (/^\s+$/.test(tok)) {
        frag.appendChild(document.createTextNode(tok));
      } else {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = tok;
        frag.appendChild(span);
      }
    });
    node.textContent = '';
    node.appendChild(frag);
  });
}

/* ---------------------------
   3) Entrance animations (3 presets)
   - stagger-float (default, smooth & “spline-like”)
   - stagger-flip (3D flip with blur)
   - mask-swipe (clip-path reveal + slide)
---------------------------- */
// 1) Niente blur nelle entrance: rimuovi "filter" da from/to
function entranceAnimation(root = '#fx') {
  const el = typeof root === 'string' ? document.querySelector(root) : root;
  const effect = (el.getAttribute('data-effect') || 'stagger-float').toLowerCase();
  const chars = el.querySelectorAll('.char');

  gsap.set(chars, { transformOrigin: '50% 70%' });

  let fromVars, toVars, base;
  if (effect === 'stagger-flip') {
    fromVars = { opacity: 0, rotationX: -80, y: 20 };                // ← no filter
    toVars   = { opacity: 1, rotationX: 0,   y: 0, duration: 0.65, ease: 'power3.out' };
    base = gsap.timeline();
  } else if (effect === 'mask-swipe') {
    el.querySelectorAll('.fog, .focus').forEach(n => n.classList.add('masked'));
    base = gsap.timeline()
      .to(el.querySelectorAll('.masked'), {
        clipPath: 'inset(0 0% 0 0)',
        duration: 0.9,
        ease: 'power2.out',
        stagger: { each: 0.02 }
      }, 0);
    fromVars = { opacity: 0, y: 18 };                                 // ← no filter
    toVars   = { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' };
  } else {
    // default: stagger-float
    fromVars = { opacity: 0, y: 28, rotation: 2 };                    // ← no filter
    toVars   = { opacity: 1, y: 0, rotation: 0, duration: 0.7, ease: 'back.out(1.6)' };
    base = gsap.timeline();
  }

  base.fromTo(chars, fromVars, toVars, 0)
    .addLabel('chars')
    .then(() => el.querySelectorAll('.masked').forEach(n => n.classList.remove('masked')));

  ScrollTrigger.create({
    trigger: el,
    start: 'top 80%',
    once: true,
    onEnter: () => base.play(0)
  });
}

// 2) Blur SOLO durante lo scroll (evita render anticipato)
function blurOnScroll(root = '#fx') {
  gsap.to(root, {
    '--blur': '9px',
    ease: 'none',
    immediateRender: false,   // ← evita che applichi blur prima dell'enter
    scrollTrigger: {
      trigger: root,
      start: 'top 65%',
      end: 'bottom top',
      scrub: true
    }
  });

  gsap.to(root + ' .fog', {
    opacity: 0.85,
    ease: 'none',
    immediateRender: false,   // ← idem
    scrollTrigger: {
      trigger: root,
      start: 'top 65%',
      end: 'bottom top',
      scrub: true
    }
  });
}

/* ---------------------------
   4) Scroll-based blur
   - Increases blur on .fog words as you scroll
   - Keeps .focus words sharp
---------------------------- */
function blurOnScroll(root = '#fx') {
  gsap.to(root, {
    '--blur': '9px',
    ease: 'none',
    scrollTrigger: {
      trigger: root,
      start: 'top 45%',
      end: 'bottom top',
      scrub: true
    }
  });

  gsap.to(root + ' .fog', {
    opacity: 0.85,
    ease: 'none',
    scrollTrigger: {
      trigger: root,
      start: 'top 65%',
      end: 'bottom top',
      scrub: true
    }
  });
}

/* ---------------------------
   5) Boot
---------------------------- */
const fx = document.getElementById('fx');
wrapWordsExceptFocus(fx, '.focus'); // wrap blur vs focus
splitToChars(fx);                   // split into letters
entranceAnimation(fx);              // run entrance animation
blurOnScroll(fx);                   // apply scroll blur
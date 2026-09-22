(() => {
  const CARD_SELECTOR = '#root .learning-card';
  const REVEAL_TEXT = /نمایش\s+(?:پاسخ|اطلاعات کانجی)/;

  const textOf = (node) => (node?.textContent || '').replace(/\s+/g, ' ').trim();

  function isAlreadyNativeFlip(card) {
    return Boolean(card.querySelector('.learning-card-flip'));
  }

  function enhance(card) {
    if (!(card instanceof HTMLElement) || card.dataset.flipRuntime === '1') return;
    if (isAlreadyNativeFlip(card)) return;

    const revealButton = [...card.querySelectorAll('button')].find((button) => REVEAL_TEXT.test(textOf(button)));
    if (!revealButton) return;

    card.dataset.flipRuntime = '1';
    const frontHTML = card.innerHTML;

    revealButton.addEventListener('click', () => {
      // React needs one render cycle to replace the unrevealed view with the answer.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!card.isConnected || isAlreadyNativeFlip(card)) return;
        const ratingGrid = card.querySelector('.rating-grid');
        if (!ratingGrid) return;

        const backHTML = card.innerHTML;
        const wrap = document.createElement('div');
        wrap.className = 'learning-card-flip-runtime';

        const front = document.createElement('div');
        front.className = 'learning-card-face-runtime learning-card-front-runtime';
        front.setAttribute('aria-hidden', 'true');
        front.innerHTML = frontHTML;

        const back = document.createElement('div');
        back.className = 'learning-card-face-runtime learning-card-back-runtime';
        back.setAttribute('aria-live', 'polite');
        back.innerHTML = backHTML;

        wrap.append(front, back);
        card.replaceChildren(wrap);
        card.classList.add('learning-card-runtime', 'is-runtime-revealed');
      }));
    }, { once: true });
  }

  const scan = () => document.querySelectorAll(CARD_SELECTOR).forEach(enhance);

  const observer = new MutationObserver(scan);
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
  scan();
})();

export const keys = {};

export function setupControls(onAction) {
  document.addEventListener('keydown', e => { keys[e.key] = true; });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  document.querySelectorAll('.btn-dpad').forEach(btn => {
    const key = btn.getAttribute('data-key');
    const press = (e) => {
      if (e && e.cancelable) e.preventDefault();
      keys[key] = true;
      btn.classList.add('active');
      if (key === 'Enter' || key === 'ArrowUp') {
        onAction();
      }
    };
    const release = (e) => {
      if (e && e.cancelable) e.preventDefault();
      keys[key] = false;
      btn.classList.remove('active');
    };
    btn.addEventListener('touchstart', press, {passive: false});
    btn.addEventListener('touchend', release, {passive: false});
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
  });
}

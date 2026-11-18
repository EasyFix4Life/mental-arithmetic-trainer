/** Public homepage introduction. The trainer remains available below the player. */
export function renderHomepageVideo(): string {
  return `
    <section id="homepage-video" class="homepage-video" aria-labelledby="soroban-title">
      <a class="skip-video" href="#practice">Skip to Practicing Mental Math!</a>
      <div class="soroban-intro">
        <h1 id="soroban-title">Soroban</h1>
        <div class="soroban-player">
          <video id="soroban-video" width="1920" height="1080" controls playsinline
                 preload="none" poster="./soroban-poster.jpg" aria-labelledby="soroban-title">
            <source src="./soroban.mp4" type="video/mp4">
          </video>
          <button id="soroban-sound" class="soroban-sound" type="button" aria-controls="soroban-video" hidden>
            Turn Sound On
          </button>
          <a id="soroban-end-link" class="soroban-end-link" href="#practice" hidden>
            <span>Start Practicing Mental Math</span>
          </a>
        </div>
      </div>
    </section>
  `;
}

export function mountHomepageVideo(intro: HTMLElement, autoplay: boolean, signal: AbortSignal): () => void {
  const video = intro.querySelector<HTMLVideoElement>('#soroban-video')!;
  const soundButton = intro.querySelector<HTMLButtonElement>('#soroban-sound')!;
  const endLink = intro.querySelector<HTMLAnchorElement>('#soroban-end-link')!;
  let autoplayCancelled = false;
  let soundAutoplayBlocked = false;

  function updateSoundButton(): void {
    soundButton.hidden = !soundAutoplayBlocked || !video.muted || video.ended;
  }

  video.addEventListener('play', () => {
    endLink.hidden = true;
    updateSoundButton();
  }, { signal });
  video.addEventListener('ended', () => {
    updateSoundButton();
    endLink.hidden = false;
  }, { signal });
  video.addEventListener('volumechange', updateSoundButton, { signal });
  soundButton.addEventListener('click', () => {
    video.muted = false;
    video.focus({ preventScroll: true });
    updateSoundButton();
    void video.play().catch(() => {
      // The native controls remain available if playback cannot start.
    });
  }, { signal });

  if (autoplay) {
    void video.play().catch((error: unknown) => {
      // A skip may interrupt a pending play request. Only retry a policy refusal.
      if (autoplayCancelled || signal.aborted || !(error instanceof DOMException) || error.name !== 'NotAllowedError') return;
      soundAutoplayBlocked = true;
      video.muted = true;
      updateSoundButton();
      void video.play().catch(() => {
        // If muted autoplay is also blocked, the sound button can start playback.
      });
    });
  }

  return () => {
    autoplayCancelled = true;
    video.pause();
  };
}

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
          <a id="soroban-end-link" class="soroban-end-link" href="#practice" hidden>
            <span>Start Practicing Mental Math</span>
          </a>
        </div>
      </div>
    </section>
  `;
}

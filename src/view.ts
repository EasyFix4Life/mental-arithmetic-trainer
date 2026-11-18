import { mountLearnView } from './learn/learnView';
import { renderDownloadsSection } from './downloadsView';
import { mountPracticeView } from './practiceView';
import { RoundController } from './roundController';
import { APP_VERSION } from './release';
import { renderHomepageVideo } from './homepageVideo';

interface ViewOptions {
  showDownloads?: boolean;
}

/** Modes share presentation only. Learn never submits to the practice controller. */
export function mountView(root: HTMLElement, controller: RoundController, viewOptions: ViewOptions = {}): () => void {
  root.innerHTML = `
    ${viewOptions.showDownloads ? renderHomepageVideo() : ''}
    <div id="practice" tabindex="-1">
    <nav id="mode-navigation" class="mode-navigation" aria-label="Modes">
      <button id="mode-learn" type="button" aria-pressed="false">Learn</button>
      <button id="mode-practice" type="button" aria-pressed="true">Practice</button>
      ${viewOptions.showDownloads ? '<a id="download-apps-link" class="download-nav-link" href="#app-downloads">Download Apps</a>' : ''}
      <span id="app-version" class="app-version">Version ${APP_VERSION}</span>
    </nav>
    <div id="learn-view" class="learn-view" hidden></div>
    <div id="practice-view"></div>
    </div>
    ${viewOptions.showDownloads ? renderDownloadsSection() : ''}
  `;
  const navigation = root.querySelector<HTMLElement>('#mode-navigation')!;
  const learn = root.querySelector<HTMLElement>('#learn-view')!;
  const practice = root.querySelector<HTMLElement>('#practice-view')!;
  const downloads = root.querySelector<HTMLElement>('#app-downloads');
  const learnButton = root.querySelector<HTMLButtonElement>('#mode-learn')!;
  const practiceButton = root.querySelector<HTMLButtonElement>('#mode-practice')!;
  const trainer = root.querySelector<HTMLElement>('#practice')!;
  const intro = root.querySelector<HTMLElement>('#homepage-video');
  const video = root.querySelector<HTMLVideoElement>('#soroban-video');
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  let mode: 'learn' | 'practice' = 'practice';

  function renderMode(): void {
    const active = controller.snapshot.phase === 'active';
    navigation.hidden = active;
    if (downloads) downloads.hidden = active;
    if (intro && intro.hidden !== active) {
      intro.hidden = active;
      if (active) video?.pause();
      else trainer.scrollIntoView();
    }
    learn.hidden = mode !== 'learn';
    practice.hidden = mode !== 'practice';
    learnButton.setAttribute('aria-pressed', String(mode === 'learn'));
    practiceButton.setAttribute('aria-pressed', String(mode === 'practice'));
    root.dataset.mode = mode;
  }

  function selectMode(next: typeof mode): void {
    // There is no Learn/hint detour or timer pause inside an active round.
    if (controller.snapshot.phase === 'active') return;
    mode = next;
    renderMode();
  }

  learnButton.addEventListener('click', () => selectMode('learn'), options);
  practiceButton.addEventListener('click', () => selectMode('practice'), options);
  const unmountLearn = mountLearnView(learn);
  const unmountPractice = mountPracticeView(practice, controller, renderMode);
  renderMode();

  if (intro && video) {
    const endLink = intro.querySelector<HTMLAnchorElement>('#soroban-end-link')!;
    video.addEventListener('ended', () => { endLink.hidden = false; }, options);
    video.addEventListener('play', () => { endLink.hidden = true; }, options);
    function showPractice(): void {
      video?.pause();
      selectMode('practice');
    }
    for (const link of intro.querySelectorAll('a[href="#practice"]')) {
      link.addEventListener('click', showPractice, options);
    }
    window.addEventListener('hashchange', () => {
      if (window.location.hash === '#practice') showPractice();
    }, options);
    if (window.location.hash === '#practice') trainer.scrollIntoView();
  }

  return () => {
    listeners.abort();
    unmountLearn();
    unmountPractice();
    root.replaceChildren();
  };
}

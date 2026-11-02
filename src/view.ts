import { mountLearnView } from './learn/learnView';
import { renderDownloadsSection } from './downloadsView';
import { mountPracticeView } from './practiceView';
import { RoundController } from './roundController';
import { APP_VERSION } from './release';

interface ViewOptions {
  showDownloads?: boolean;
}

/** Modes share presentation only. Learn never submits to the practice controller. */
export function mountView(root: HTMLElement, controller: RoundController, viewOptions: ViewOptions = {}): () => void {
  root.innerHTML = `
    <nav id="mode-navigation" class="mode-navigation" aria-label="Modes">
      <button id="mode-learn" type="button" aria-pressed="false">Learn</button>
      <button id="mode-practice" type="button" aria-pressed="true">Practice</button>
      ${viewOptions.showDownloads ? '<a id="download-apps-link" class="download-nav-link" href="#app-downloads">Download Apps</a>' : ''}
      <span id="app-version" class="app-version">Version ${APP_VERSION}</span>
    </nav>
    <div id="learn-view" class="learn-view" hidden></div>
    <div id="practice-view"></div>
    ${viewOptions.showDownloads ? renderDownloadsSection() : ''}
  `;
  const navigation = root.querySelector<HTMLElement>('#mode-navigation')!;
  const learn = root.querySelector<HTMLElement>('#learn-view')!;
  const practice = root.querySelector<HTMLElement>('#practice-view')!;
  const downloads = root.querySelector<HTMLElement>('#app-downloads');
  const learnButton = root.querySelector<HTMLButtonElement>('#mode-learn')!;
  const practiceButton = root.querySelector<HTMLButtonElement>('#mode-practice')!;
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  let mode: 'learn' | 'practice' = 'practice';

  function renderMode(): void {
    const active = controller.snapshot.phase === 'active';
    navigation.hidden = active;
    if (downloads) downloads.hidden = active;
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

  return () => {
    listeners.abort();
    unmountLearn();
    unmountPractice();
    root.replaceChildren();
  };
}

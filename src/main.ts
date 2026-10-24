import './style.css';
import { RoundController } from './roundController';
import { mountView } from './view';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Application root is missing.');
mountView(root, new RoundController());

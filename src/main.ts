import './style.css';
import { GameScene } from './scenes/GameScene';

const app = document.getElementById('app');
if (!app) {
  throw new Error('#app container not found');
}

const hud = document.createElement('div');
hud.className = 'hud';
hud.textContent = '0';
document.body.appendChild(hud);

const scene = new GameScene(app, {
  onScoreChange: (score) => {
    hud.textContent = String(score);
  },
});

scene.start();

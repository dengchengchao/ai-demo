import './style.css';
import { GameScene } from './scenes/GameScene';

const app = document.getElementById('app');
if (!app) throw new Error('#app not found');

const game = new GameScene(app);
game.start();

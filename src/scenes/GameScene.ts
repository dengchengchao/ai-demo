import * as THREE from 'three';
import { onResize } from '../utils/resize';
import { Player } from '../entities/Player';
import { Platform } from '../entities/Platform';
import { PerfectEffect } from '../entities/PerfectEffect';
import { AudioManager } from '../audio/AudioManager';
import { UI } from '../ui/UI';

type GameState = 'start' | 'idle' | 'charging' | 'jumping' | 'gameover';

const MIN_GAP = 2.2;
const MAX_GAP = 4.5;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export class GameScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.OrthographicCamera;
  private disposeResize: (() => void) | null = null;
  private rafId = 0;
  private lastTime = 0;

  private state: GameState = 'start';
  private score = 0;
  private best = parseInt(localStorage.getItem('jump_best') ?? '0', 10);
  private combo = 0;

  private player!: Player;
  private platforms: Platform[] = [];
  private currentPlatIdx = 0;

  private perfectEffect!: PerfectEffect;
  private audio: AudioManager;
  private ui: UI;

  // Jump direction (toward next platform)
  private nextDir = new THREE.Vector3();
  // Camera target
  private camTarget = new THREE.Vector3();

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x1a1a2e);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = this.makeCamera();

    this.audio = new AudioManager();
    this.ui = new UI();

    this.buildLighting();
    this.buildInitialPlatforms();
    this.buildPlayer();
    this.perfectEffect = new PerfectEffect(this.scene);

    this.ui.onStartClick(() => this.startGame());
    this.ui.onRetryClick(() => this.restartGame());

    this.bindInput();

    this.disposeResize = onResize(container, (w, h) => this.handleResize(w, h));
    this.handleResize(container.clientWidth, container.clientHeight);
  }

  start(): void {
    const tick = (time: number) => {
      this.rafId = requestAnimationFrame(tick);
      const dt = Math.min((time - this.lastTime) / 1000, 0.05);
      this.lastTime = time;
      this.update(dt);
      this.renderer.render(this.scene, this.camera);
    };
    requestAnimationFrame((t) => { this.lastTime = t; tick(t); });
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    this.disposeResize?.();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // ─── Setup ────────────────────────────────────────────────────────────────

  private makeCamera(): THREE.OrthographicCamera {
    const cam = new THREE.OrthographicCamera(-6, 6, 6, -6, 0.1, 200);
    cam.position.set(12, 15, 12);
    cam.lookAt(0, 0, 0);
    return cam;
  }

  private buildLighting(): void {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(8, 14, 8);
    this.scene.add(dir);
  }

  private buildInitialPlatforms(): void {
    const p0 = new Platform(this.scene);
    p0.place(0, 0);

    const p1 = new Platform(this.scene);
    const gap = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
    p1.place(gap, 0); // first jump always goes +X

    this.platforms = [p0, p1];
    this.currentPlatIdx = 0;
  }

  private buildPlayer(): void {
    this.player = new Player(this.scene);
    const p = this.platforms[0].center;
    this.player.setPosition(p.x, 0.6, p.z);

    this.camTarget.set(p.x, 0, p.z);
    this.camera.position.set(p.x + 12, 15, p.z + 12);
    this.camera.lookAt(p.x, 0, p.z);
  }

  private bindInput(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousedown', () => this.onPressStart());
    canvas.addEventListener('mouseup', () => this.onPressEnd());
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this.onPressStart(); }, { passive: false });
    canvas.addEventListener('touchend', (e) => { e.preventDefault(); this.onPressEnd(); }, { passive: false });
  }

  // ─── Input ────────────────────────────────────────────────────────────────

  private onPressStart(): void {
    if (this.state !== 'idle') return;
    this.audio.unlock();
    this.audio.startCharge();
    this.player.startCharge();
    this.state = 'charging';
  }

  private onPressEnd(): void {
    if (this.state !== 'charging') return;
    this.audio.stopCharge();

    const cur = this.platforms[this.currentPlatIdx].center;
    const next = this.platforms[this.currentPlatIdx + 1].center;
    const dx = next.x - cur.x;
    const dz = next.z - cur.z;
    this.nextDir.set(dx, 0, dz).normalize();

    this.player.releaseCharge(dx, dz, (lx, lz) => this.onLand(lx, lz));
    this.audio.playJump();
    this.state = 'jumping';
    this.ui.hideCharge();
  }

  // ─── Landing ──────────────────────────────────────────────────────────────

  private onLand(lx: number, lz: number): void {
    const nextPlat = this.platforms[this.currentPlatIdx + 1];
    const result = nextPlat.checkLanding(lx, lz);

    if (result === 'miss') {
      this.audio.playGameOver();
      this.state = 'gameover';
      this.combo = 0;
      this.ui.showCombo(0);
      setTimeout(() => {
        if (this.score > this.best) {
          this.best = this.score;
          localStorage.setItem('jump_best', String(this.best));
        }
        this.ui.showOver(this.score, this.best);
      }, 600);
      return;
    }

    this.audio.playLand();

    if (result === 'perfect') {
      this.score += 2;
      this.combo++;
      this.audio.playPerfect();
      this.perfectEffect.trigger(lx, nextPlat.mesh.position.y + 0.35, lz);
      this.ui.floatText('完美! +2', '#ffd700');
    } else {
      this.score += 1 + Math.floor(this.combo / 3);
      this.combo++;
      this.ui.floatText(`+${1 + Math.floor(this.combo / 3)}`);
    }

    this.ui.setScore(this.score);
    this.ui.showCombo(this.combo);

    // Advance
    this.currentPlatIdx++;

    // Remove old platform if too many
    if (this.platforms.length > this.currentPlatIdx + 2) {
      const old = this.platforms.shift();
      this.currentPlatIdx--;
      old?.dispose(this.scene);
    }

    // Generate next platform
    this.spawnNextPlatform();
    this.state = 'idle';
  }

  private spawnNextPlatform(): void {
    const last = this.platforms[this.platforms.length - 1].center;
    const prev = this.platforms[this.platforms.length - 2]?.center;
    const gap = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);

    // Alternate axis
    let dx = 0, dz = 0;
    if (prev) {
      const wasX = Math.abs(last.x - prev.x) > Math.abs(last.z - prev.z);
      if (wasX) dz = gap * (Math.random() < 0.5 ? 1 : -1);
      else dx = gap * (Math.random() < 0.5 ? 1 : -1);
    } else {
      dx = gap;
    }

    const p = new Platform(this.scene);
    p.place(last.x + dx, last.z + dz);
    this.platforms.push(p);
  }

  // ─── Game flow ────────────────────────────────────────────────────────────

  private startGame(): void {
    this.ui.hideStart();
    this.state = 'idle';
  }

  private restartGame(): void {
    this.ui.hideOver();
    this.score = 0;
    this.combo = 0;
    this.ui.setScore(0);
    this.ui.showCombo(0);

    for (const p of this.platforms) p.dispose(this.scene);
    this.platforms = [];
    this.scene.remove(this.player.mesh);

    this.buildInitialPlatforms();
    this.buildPlayer();
    this.state = 'idle';
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  private update(dt: number): void {
    this.player.update(dt);
    this.perfectEffect.update(dt);

    if (this.state === 'charging') {
      this.ui.showCharge(this.player.chargeNormalized);
    }

    // Camera follow
    const pp = this.player.position;
    this.camTarget.x = lerp(this.camTarget.x, pp.x, 1 - Math.pow(0.002, dt));
    this.camTarget.z = lerp(this.camTarget.z, pp.z, 1 - Math.pow(0.002, dt));
    this.camera.position.set(this.camTarget.x + 12, 15, this.camTarget.z + 12);
    this.camera.lookAt(this.camTarget.x, 0, this.camTarget.z);
  }

  private handleResize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    const v = 7;
    this.camera.left = -v * aspect;
    this.camera.right = v * aspect;
    this.camera.top = v;
    this.camera.bottom = -v;
    this.camera.updateProjectionMatrix();
  }
}

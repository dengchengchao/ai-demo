import * as THREE from 'three';
import { onResize } from '../utils/resize';

export interface GameSceneOptions {
  onScoreChange?: (score: number) => void;
}

/**
 * Skeleton game scene. Renders a placeholder platform and player so we can
 * verify the rendering pipeline / mobile viewport works end-to-end.
 *
 * Real gameplay (charge → jump → physics → collision → camera follow) will be
 * filled in by subsequent issues; this scaffold establishes the lifecycle.
 */
export class GameScene {
  private readonly container: HTMLElement;
  private readonly options: GameSceneOptions;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.OrthographicCamera;

  private rafId = 0;
  private disposeResize: (() => void) | null = null;
  private score = 0;

  constructor(container: HTMLElement, options: GameSceneOptions = {}) {
    this.container = container;
    this.options = options;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x1a1a2e, 1);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = this.createCamera();
    this.populatePlaceholder();
  }

  start(): void {
    this.disposeResize = onResize(this.container, (w, h) => this.handleResize(w, h));
    this.handleResize(this.container.clientWidth, this.container.clientHeight);
    this.options.onScoreChange?.(this.score);

    const tick = () => {
      this.rafId = requestAnimationFrame(tick);
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    this.disposeResize?.();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private createCamera(): THREE.OrthographicCamera {
    // Isometric-ish framing, similar to the original 跳一跳.
    const cam = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
    cam.position.set(8, 10, 8);
    cam.lookAt(0, 0, 0);
    return cam;
  }

  private populatePlaceholder(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7);
    this.scene.add(ambient, directional);

    const platformGeo = new THREE.BoxGeometry(2, 1, 2);
    const platformMat = new THREE.MeshLambertMaterial({ color: 0xe0a96d });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.5;
    this.scene.add(platform);

    const playerGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 16);
    const playerMat = new THREE.MeshLambertMaterial({ color: 0x4f8ef7 });
    const player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 0.6;
    this.scene.add(player);
  }

  private handleResize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    const viewSize = 6;
    this.camera.left = -viewSize * aspect;
    this.camera.right = viewSize * aspect;
    this.camera.top = viewSize;
    this.camera.bottom = -viewSize;
    this.camera.updateProjectionMatrix();
  }
}

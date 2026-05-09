import * as THREE from 'three';

export type PlayerState = 'idle' | 'charging' | 'jumping' | 'landing';

const BASE_HEIGHT = 1.0;
const BASE_RADIUS = 0.28;

export class Player {
  readonly mesh: THREE.Group;
  private body: THREE.Mesh;
  private state: PlayerState = 'idle';
  private chargeTime = 0;
  private jumpVx = 0;
  private jumpVz = 0;
  private velY = 0;
  private groundY = 0;
  private onLandCallback?: (x: number, z: number) => void;
  private landingTimer = 0;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group();

    const geo = new THREE.CylinderGeometry(BASE_RADIUS, BASE_RADIUS, BASE_HEIGHT, 24);
    const mat = new THREE.MeshLambertMaterial({ color: 0x4f8ef7 });
    this.body = new THREE.Mesh(geo, mat);
    this.body.position.y = BASE_HEIGHT / 2;
    this.mesh.add(this.body);

    // Head (small sphere)
    const headGeo = new THREE.SphereGeometry(BASE_RADIUS * 0.8, 16, 16);
    const head = new THREE.Mesh(headGeo, mat);
    head.position.y = BASE_HEIGHT + BASE_RADIUS * 0.5;
    this.mesh.add(head);

    scene.add(this.mesh);
  }

  setPosition(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z);
    this.groundY = y;
  }

  get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  startCharge(): void {
    if (this.state !== 'idle') return;
    this.state = 'charging';
    this.chargeTime = 0;
  }

  /** Returns the normalized charge power [0,1] */
  releaseCharge(dirX: number, dirZ: number, onLand: (x: number, z: number) => void): number {
    if (this.state !== 'charging') return 0;
    const power = Math.min(this.chargeTime / 1.5, 1);
    const speed = 3 + power * 7;
    const len = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
    this.jumpVx = (dirX / len) * speed;
    this.jumpVz = (dirZ / len) * speed;
    this.velY = 6 + power * 4;
    this.state = 'jumping';
    this.onLandCallback = onLand;
    // Reset body scale
    this.body.scale.set(1, 1, 1);
    return power;
  }

  update(dt: number): void {
    switch (this.state) {
      case 'charging':
        this.chargeTime += dt;
        {
          const squeeze = Math.min(this.chargeTime / 1.5, 1);
          this.body.scale.set(1 + squeeze * 0.3, 1 - squeeze * 0.25, 1 + squeeze * 0.3);
        }
        break;

      case 'jumping':
        this.mesh.position.x += this.jumpVx * dt;
        this.mesh.position.z += this.jumpVz * dt;
        this.velY -= 18 * dt;
        this.mesh.position.y += this.velY * dt;
        if (this.mesh.position.y <= this.groundY) {
          this.mesh.position.y = this.groundY;
          this.state = 'landing';
          this.landingTimer = 0;
          this.onLandCallback?.(this.mesh.position.x, this.mesh.position.z);
        }
        break;

      case 'landing':
        this.landingTimer += dt;
        {
          const t = this.landingTimer / 0.3;
          if (t >= 1) {
            this.body.scale.set(1, 1, 1);
            this.state = 'idle';
          } else {
            const squish = Math.sin(t * Math.PI);
            this.body.scale.set(1 + squish * 0.2, 1 - squish * 0.15, 1 + squish * 0.2);
          }
        }
        break;
    }
  }

  get isIdle(): boolean { return this.state === 'idle'; }
  get isJumping(): boolean { return this.state === 'jumping'; }
  get chargeNormalized(): number { return Math.min(this.chargeTime / 1.5, 1); }
}

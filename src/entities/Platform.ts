import * as THREE from 'three';

export type PlatformShape = 'box' | 'cylinder';

const COLORS = [0xe0a96d, 0x6db4e0, 0xa96de0, 0x6de0a9, 0xe06d9b, 0xe0d46d];

export class Platform {
  readonly mesh: THREE.Mesh;
  readonly shape: PlatformShape;
  readonly radius: number; // half-width for box, radius for cylinder

  private _center = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.shape = Math.random() < 0.5 ? 'box' : 'cylinder';
    this.radius = 0.9 + Math.random() * 0.6;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const height = 0.6 + Math.random() * 0.3;

    let geo: THREE.BufferGeometry;
    if (this.shape === 'cylinder') {
      geo = new THREE.CylinderGeometry(this.radius, this.radius, height, 32);
    } else {
      const w = this.radius * 2;
      const d = this.radius * 2 * (0.7 + Math.random() * 0.6);
      geo = new THREE.BoxGeometry(w, height, d);
    }
    const mat = new THREE.MeshLambertMaterial({ color });
    this.mesh = new THREE.Mesh(geo, mat);
    scene.add(this.mesh);
  }

  get center(): THREE.Vector3 {
    return this._center;
  }

  place(x: number, z: number): void {
    this.mesh.position.set(x, 0, z);
    this._center.set(x, 0, z);
  }

  /** Returns 'perfect' | 'hit' | 'miss' */
  checkLanding(px: number, pz: number): 'perfect' | 'hit' | 'miss' {
    const dx = px - this._center.x;
    const dz = pz - this._center.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < this.radius * 0.18) return 'perfect';
    if (dist < this.radius) return 'hit';
    return 'miss';
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

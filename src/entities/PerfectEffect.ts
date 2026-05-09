import * as THREE from 'three';

export class PerfectEffect {
  private rings: Array<{ mesh: THREE.Mesh; t: number }> = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  trigger(x: number, y: number, z: number): void {
    for (let i = 0; i < 2; i++) {
      const geo = new THREE.RingGeometry(0.1, 0.25, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, y + 0.05 + i * 0.05, z);
      this.scene.add(mesh);
      this.rings.push({ mesh, t: i * 0.1 });
    }
  }

  update(dt: number): void {
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.t += dt;
      const progress = Math.min(r.t / 0.6, 1);
      const scale = 1 + progress * 3;
      r.mesh.scale.setScalar(scale);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
      if (progress >= 1) {
        this.scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        (r.mesh.material as THREE.Material).dispose();
        this.rings.splice(i, 1);
      }
    }
  }
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  private chargeOsc: OscillatorNode | null = null;
  private chargeGain: GainNode | null = null;

  unlock(): void {
    if (this.unlocked) return;
    this.ctx = new AudioContext();
    this.unlocked = true;
  }

  startCharge(): void {
    if (!this.ctx) return;
    this.stopCharge();
    this.chargeOsc = this.ctx.createOscillator();
    this.chargeGain = this.ctx.createGain();
    this.chargeOsc.type = 'sine';
    this.chargeOsc.frequency.setValueAtTime(80, this.ctx.currentTime);
    this.chargeGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    this.chargeOsc.connect(this.chargeGain);
    this.chargeGain.connect(this.ctx.destination);
    this.chargeOsc.start();
  }

  stopCharge(): void {
    if (this.chargeOsc) {
      this.chargeOsc.stop();
      this.chargeOsc.disconnect();
      this.chargeOsc = null;
    }
    if (this.chargeGain) {
      this.chargeGain.disconnect();
      this.chargeGain = null;
    }
  }

  playJump(): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playLand(): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playPerfect(): void {
    if (!this.ctx) return;
    for (const freq of [800, 1200]) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    }
  }

  playGameOver(): void {
    if (!this.ctx) return;
    const notes = [{ f: 600, t: 0 }, { f: 400, t: 0.2 }, { f: 300, t: 0.4 }, { f: 150, t: 0.6 }];
    for (const { f, t } of notes) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + t);
      gain.gain.setValueAtTime(0, this.ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + t + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + t);
      osc.stop(this.ctx.currentTime + t + 0.2);
    }
  }
}

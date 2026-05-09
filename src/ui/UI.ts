export class UI {
  private scoreEl: HTMLElement;
  private chargeBarWrap: HTMLElement;
  private chargeBar: HTMLElement;
  private startScreen: HTMLElement;
  private overScreen: HTMLElement;
  private overScore: HTMLElement;
  private overBest: HTMLElement;
  private floatContainer: HTMLElement;
  private comboEl: HTMLElement;

  constructor() {
    // Score
    this.scoreEl = this.el('div', 'score', '0');
    // Charge bar
    this.chargeBarWrap = this.el('div', 'charge-wrap');
    this.chargeBar = this.el('div', 'charge-bar');
    this.chargeBarWrap.appendChild(this.chargeBar);
    this.chargeBarWrap.style.display = 'none';
    // Float text container
    this.floatContainer = this.el('div', 'float-container');
    // Combo
    this.comboEl = this.el('div', 'combo');
    this.comboEl.style.display = 'none';

    // Start screen
    this.startScreen = this.el('div', 'overlay start-screen');
    this.startScreen.innerHTML = `
      <div class="game-title">跳一跳</div>
      <button class="btn-start">开始游戏</button>
    `;

    // Game over screen
    this.overScreen = this.el('div', 'overlay over-screen');
    this.overScreen.style.display = 'none';
    this.overScore = this.el('div', 'over-score', '0');
    this.overBest = this.el('div', 'over-best', '最高分: 0');
    const retryBtn = this.el('button', 'btn-start', '再来一次');
    this.overScreen.appendChild(this.el('div', 'over-title', '游戏结束'));
    this.overScreen.appendChild(this.overScore);
    this.overScreen.appendChild(this.overBest);
    this.overScreen.appendChild(retryBtn);

    document.body.append(
      this.scoreEl,
      this.chargeBarWrap,
      this.floatContainer,
      this.comboEl,
      this.startScreen,
      this.overScreen,
    );
  }

  onStartClick(cb: () => void): void {
    this.startScreen.querySelector('.btn-start')!.addEventListener('click', cb);
  }

  onRetryClick(cb: () => void): void {
    this.overScreen.querySelector('.btn-start')!.addEventListener('click', cb);
  }

  hideStart(): void { this.startScreen.style.display = 'none'; }
  showOver(score: number, best: number): void {
    this.overScore.textContent = String(score);
    this.overBest.textContent = `最高分: ${best}`;
    this.overScreen.style.display = 'flex';
  }
  hideOver(): void { this.overScreen.style.display = 'none'; }

  setScore(n: number): void { this.scoreEl.textContent = String(n); }

  showCharge(power: number): void {
    this.chargeBarWrap.style.display = 'flex';
    this.chargeBar.style.width = `${Math.round(power * 100)}%`;
  }
  hideCharge(): void { this.chargeBarWrap.style.display = 'none'; }

  floatText(text: string, color = '#fff'): void {
    const el = document.createElement('div');
    el.className = 'float-text';
    el.textContent = text;
    el.style.color = color;
    el.style.left = '50%';
    el.style.bottom = '45%';
    this.floatContainer.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  showCombo(n: number): void {
    if (n < 2) { this.comboEl.style.display = 'none'; return; }
    this.comboEl.textContent = `连击 x${n}`;
    this.comboEl.style.display = 'block';
  }

  private el(tag: string, cls: string, text?: string): HTMLElement {
    const e = document.createElement(tag);
    e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
}

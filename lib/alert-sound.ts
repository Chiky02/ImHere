"use client";

export const FALLBACK_ALERT_SRC = "/sounds/alerta.wav";

export class AlertPlayer {
  private audio: HTMLAudioElement | null = null;
  private unlocked = false;
  private src = FALLBACK_ALERT_SRC;

  get isUnlocked() {
    return this.unlocked;
  }

  get isPlaying() {
    return Boolean(this.audio && !this.audio.paused);
  }

  setSource(src: string) {
    if (src && src !== this.src) {
      this.stop();
      this.src = src;
      this.audio = null;
    }
  }

  /** Force reload even if the base path is the same (cache-bust query). */
  forceSource(src: string) {
    this.stop();
    this.src = src || FALLBACK_ALERT_SRC;
    this.audio = null;
  }

  /** Debe llamarse desde un click del usuario (política del navegador). */
  async unlock(src?: string) {
    if (src) this.setSource(src);
    const audio = this.ensure();
    audio.loop = false;
    audio.currentTime = 0;
    try {
      await audio.play();
      window.setTimeout(() => {
        if (audio && !audio.loop) audio.pause();
      }, 900);
      this.unlocked = true;
      return true;
    } catch {
      this.unlocked = false;
      return false;
    }
  }

  async ring(opts?: { loop?: boolean; src?: string }) {
    if (!this.unlocked) return false;
    if (opts?.src) this.setSource(opts.src);
    const audio = this.ensure();
    audio.loop = opts?.loop ?? true;
    try {
      audio.currentTime = 0;
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }

  stop() {
    if (!this.audio) return;
    this.audio.loop = false;
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  private ensure() {
    const url = this.src || FALLBACK_ALERT_SRC;
    if (!this.audio || this.audio.dataset.src !== url) {
      this.stop();
      this.audio = new Audio(url);
      this.audio.dataset.src = url;
      this.audio.preload = "auto";
      this.audio.volume = 1;
    }
    return this.audio;
  }
}

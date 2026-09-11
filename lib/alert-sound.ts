"use client";

/**
 * Sonido de alerta del panel.
 * 1) Coloca tu canción/alarma en: public/sounds/alerta.mp3 (o .wav / .ogg)
 * 2) O define NEXT_PUBLIC_ALERT_SOUND_URL=https://... en .env
 * Por defecto usa /sounds/alerta.wav (sirena ~8s).
 */
export const DEFAULT_ALERT_SRC =
  process.env.NEXT_PUBLIC_ALERT_SOUND_URL?.trim() || "/sounds/alerta.wav";

export class AlertPlayer {
  private audio: HTMLAudioElement | null = null;
  private unlocked = false;

  get isUnlocked() {
    return this.unlocked;
  }

  get isPlaying() {
    return Boolean(this.audio && !this.audio.paused);
  }

  /** Debe llamarse desde un click del usuario (política del navegador). */
  async unlock(src = DEFAULT_ALERT_SRC) {
    const audio = this.ensure(src);
    audio.loop = false;
    audio.currentTime = 0;
    try {
      await audio.play();
      // Prueba corta al activar, luego pausa
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
    const audio = this.ensure(opts?.src);
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

  private ensure(src?: string) {
    const url = src || DEFAULT_ALERT_SRC;
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

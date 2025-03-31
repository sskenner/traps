import { useAudio } from '@/lib/stores/useAudio';

class SoundManager {
  private static instance: SoundManager;
  private hitSound: HTMLAudioElement | null = null;
  private successSound: HTMLAudioElement | null = null;
  private backgroundMusic: HTMLAudioElement | null = null;
  private isMuted: boolean = true;
  
  private constructor() {
    // Initialize sounds
    this.loadSounds();
  }
  
  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    
    return SoundManager.instance;
  }
  
  private loadSounds() {
    // Load background music
    this.backgroundMusic = new Audio('/sounds/background.mp3');
    if (this.backgroundMusic) {
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = 0.4;
    }
    
    // Load sound effects
    this.hitSound = new Audio('/sounds/hit.mp3');
    if (this.hitSound) {
      this.hitSound.volume = 0.3;
    }
    
    this.successSound = new Audio('/sounds/success.mp3');
    if (this.successSound) {
      this.successSound.volume = 0.5;
    }
  }
  
  public playBackgroundMusic() {
    if (this.backgroundMusic && !this.isMuted) {
      this.backgroundMusic.play().catch(err => {
        console.log('Background music play prevented:', err);
      });
    }
  }
  
  public stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }
  
  public playHitSound() {
    if (this.hitSound && !this.isMuted) {
      // Clone the sound to allow overlapping playback
      const soundClone = this.hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  }
  
  public playSuccessSound() {
    if (this.successSound && !this.isMuted) {
      this.successSound.currentTime = 0;
      this.successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  }
  
  public setMuted(muted: boolean) {
    this.isMuted = muted;
    
    if (muted && this.backgroundMusic) {
      this.backgroundMusic.pause();
    } else if (!muted && this.backgroundMusic) {
      this.backgroundMusic.play().catch(err => {
        console.log('Background music play prevented:', err);
      });
    }
  }
  
  public isSoundMuted(): boolean {
    return this.isMuted;
  }
}

export default SoundManager;

import * as THREE from 'three';
import { Player, Projectile, UI } from './components';
import { EnemyManager, OverlayManager } from './managers';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

class GameState {
  private static instance: GameState;

  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  composer!: EffectComposer;
  enemyManager!: EnemyManager;
  player!: Player;
  reticle!: THREE.Object3D;
  stats!: Stats;
  ui!: UI;
  projectiles: Projectile[] = [];

  private playTime: number = 0; // Total playtime in milliseconds
  private lastResumeTime: number = 0; // Timestamp of when the game was last resumed
  private gameInitialized: boolean = false;
  private paused: boolean = false;
  private gameScore = 0

  private constructor() {}

  public static getInstance(): GameState {
    if (!GameState.instance) {
      console.log('Initializing GameState'); // Debug log
      GameState.instance = new GameState();
      console.log('GameState initialized:', GameState.instance); // Debug log
    }
    return GameState.instance;
  }

  public isGameInitialized(): boolean {
    return this.gameInitialized;
  }

  public getScore(): number {
    return this.gameScore;
  }
  public addScore(points: number): void {
    this.gameScore += points;
  }
  public resetScore(): void {
    this.gameScore = 0;
  }

  public setGameInitialized(value: boolean): void {
    this.gameInitialized = value;
    OverlayManager.getInstance().updateLoadingOverlay(!value);
  }

  public stopTimer(): void {
    if (!this.paused) {
      this.paused = true;
      this.playTime += Date.now() - this.lastResumeTime; // Accumulate playtime
    }
  }
  public resumeTimer(): void {
    if (this.paused) {
      this.paused = false;
      this.lastResumeTime = Date.now();
    }
  }

  public resetTimer(): void {
    this.playTime = 0;
    this.lastResumeTime = Date.now();
  }

  public getPlayTime(): number {
    if (this.paused) {
      return this.playTime; // Return accumulated playtime when paused
    }
    return this.playTime + (Date.now() - this.lastResumeTime); // Include time since last resume
  }

  public isPaused(): boolean {
    
    return this.paused;
  }
  public setPaused(value: boolean): void {
    this.paused = value;
  }

  public get isLoading(): boolean {
    return !this.gameInitialized;
  }


//   public reset() {
//     this.projectiles = [];
//     this.player = new Player(); // Example reinitialization
//     this.enemyManager = new EnemyManager(this.scene, this.player, this.projectiles, 2000);
//     // Reset other properties as needed
//   }
}

export default GameState;
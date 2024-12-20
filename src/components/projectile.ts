import * as THREE from 'three';
import GameState from '../gameState';

const ProjectileConfig = {
  geometry: {
    radiusTop: 0.1,
    radiusBottom: 0.1,
    height: 2,
    radialSegments: 16,
  },
  material: {
    color: 0x0bff3f,
    emissive: 0xfcba03,
    emissiveIntensity: 1.25,
  },
  rotation: {
    x: Math.PI / 2,
  },
  defaultSpeed: 1,
  defaultMaxRange: 50,
  defaultPierceCount: 1,
};

export class Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  startPosition: THREE.Vector3;
  maxRange: number;
  speed: number;
  pierceCount: number;
  raycaster: THREE.Raycaster;
  enemiesHit: Set<THREE.Object3D>;
  onEnemyHitCallback?: (enemy: THREE.Object3D) => void;
  public scheduledForRemoval: boolean = false;

  constructor(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    maxRange: number = ProjectileConfig.defaultMaxRange,
    pierceCount: number = ProjectileConfig.defaultPierceCount,
    onEnemyHitCallback?: (enemy: THREE.Object3D) => void
  ) {
    this.mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        ProjectileConfig.geometry.radiusTop,
        ProjectileConfig.geometry.radiusBottom,
        ProjectileConfig.geometry.height,
        ProjectileConfig.geometry.radialSegments
      ),
      new THREE.MeshStandardMaterial({
        color: ProjectileConfig.material.color,
        emissive: ProjectileConfig.material.emissive,
        emissiveIntensity: ProjectileConfig.material.emissiveIntensity,
      })
    );
    this.mesh.rotation.x = ProjectileConfig.rotation.x;
    this.mesh.position.copy(position);
    this.speed = ProjectileConfig.defaultSpeed;
    this.startPosition = position.clone();
    this.maxRange = maxRange;
    this.pierceCount = pierceCount;
    this.velocity = direction.clone().normalize();
    this.raycaster = new THREE.Raycaster(position, direction.clone().normalize());
    this.enemiesHit = new Set();
    this.onEnemyHitCallback = onEnemyHitCallback;
  }

  public update(): void {
    this.move();
    this.adjustBeamDirection();

    // Remove immediately if out of range
    if (this.hasExceededRange()) { this.scheduleRemoval(); }
    // Remove delayed if scheduled for delay (delay for animation)
    if (this.pierceCount <= 0 && !this.scheduledForRemoval) {
      setTimeout(() => { this.scheduleRemoval }, 200);
    }
    
    this.checkCollisions();
  }

  private move(): void {
    this.mesh.position.add(this.velocity.clone().multiplyScalar(this.speed));
  }

  private scheduleRemoval(): void {
    const gameState = GameState.getInstance();
    gameState.scene.remove(this.mesh);
    this.scheduledForRemoval = true;
  }
  private adjustBeamDirection(): void {
    const direction = this.velocity.clone().normalize();
    const axis = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
    this.mesh.quaternion.copy(quaternion);
  }

  private hasExceededRange(): boolean {
    const distance = this.mesh.position.distanceTo(this.startPosition);
    return distance > this.maxRange;
  }

  private checkCollisions(): void {
    const gameState = GameState.getInstance();
    const enemies = gameState.enemyManager.getEnemies().map(enemy => enemy.object);

    this.raycaster.params.Line = { threshold: 5 }; // Adjust for thicker raycaster line
    this.raycaster.params.Mesh = { threshold: 5 }; // Adjust for wider collision detection
    this.raycaster.set(this.mesh.position, this.velocity);

    const intersects = this.raycaster.intersectObjects(enemies, true);
    
    intersects.forEach(intersect => this.handleIntersection(intersect));
  }

  private handleIntersection(intersect: THREE.Intersection): void {
    let targetObject = intersect.object;

    while (targetObject.parent && targetObject.parent.type !== 'Scene') {
      targetObject = targetObject.parent;
    }

    if (!this.enemiesHit.has(targetObject) && this.pierceCount > 0) {

      this.enemiesHit.add(targetObject);
      this.pierceCount--;

      const distanceToEnemy = this.mesh.position.distanceTo(intersect.point);
      const rawTimeToImpact = distanceToEnemy / this.speed;
      const maxTimeToImpact = 0.5;
      const timeToImpact = Math.min(rawTimeToImpact, maxTimeToImpact);

      
      setTimeout(() => {
        if (this.onEnemyHitCallback) {
          this.onEnemyHitCallback!(targetObject);
        }else {
          console.warn('No callback defined for this projectile.');
        }
        this.scheduleRemoval();
      }, timeToImpact * 500);
    }
  }
  

}
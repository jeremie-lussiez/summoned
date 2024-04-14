import { TextureLoader, MeshBasicMaterial, ClampToEdgeWrapping, DoubleSide, Mesh, NearestFilter, PlaneGeometry, Texture } from "three";
import { SpriteAnimation } from "./sprite-animation";

export class AnimatedSprite {
    private animations: Record<string, SpriteAnimation>;

    private currentAnimation: SpriteAnimation;
    private frames: number;
    private animationIndex: number;
    private animationStart: number;
    private mesh: Mesh;
    private texture: Texture;
    private size: number;

    constructor(path: string, size: number, animations: Record<string, SpriteAnimation>) {
        this.animations = animations;
        this.currentAnimation = Object.values(this.animations)[0];
        this.animationIndex = this.currentAnimation.start;
        this.animationStart = performance.now() + this.currentAnimation.speed;

        this.texture = new TextureLoader().load(path);
        const spriteMaterial = new MeshBasicMaterial({ map: this.texture, side: DoubleSide, transparent: true });
        this.size = size;
        this.frames = Object.values(this.animations).length;
        this.texture.wrapS = ClampToEdgeWrapping;
        this.texture.magFilter = NearestFilter;
        this.texture.repeat.set(1 / this.frames, 1);
        this.texture.offset.x = this.animationIndex / this.frames;
        const spriteGeometry = new PlaneGeometry(this.size, this.size, 1, 1);
        this.mesh = new Mesh(spriteGeometry, spriteMaterial);
    }

    public setAnimation(animationId: string) {
        this.currentAnimation = this.animations[animationId];
        this.animationIndex = this.currentAnimation.start;
        this.animationStart = performance.now() + this.currentAnimation.speed;
        this.texture.offset.x = this.animationIndex / this.frames;
    }

    public update(time: number) {
        if (this.animationStart < time) {
            this.animationIndex += 1;
            if (this.animationIndex > this.currentAnimation.end) {
                this.animationIndex = this.currentAnimation.start;
            }
            this.animationStart = time + this.currentAnimation.speed;
            this.texture.offset.x = this.animationIndex / this.frames;
        }
    }

    public dispose() {
        this.mesh.geometry.dispose();
    }
}

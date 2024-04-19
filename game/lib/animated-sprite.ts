import { TextureLoader, MeshBasicMaterial, ClampToEdgeWrapping, DoubleSide, Mesh, NearestFilter, PlaneGeometry, Texture, RepeatWrapping } from "three";
import { SpriteAnimation } from "./sprite-animation";

export enum AnimatedSpriteDirection {
    Right = 1,
    Left = -1,
};

export class AnimatedSprite {
    
    private animations: Record<string, SpriteAnimation>;

    private currentAnimation: SpriteAnimation;
    private frames: number;
    private animationFrameIndex: number;
    private animationStartTime: number;
    public mesh: Mesh;
    private texture: Texture;
    private size: number;

    constructor(path: string, size: number, animations: Record<string, SpriteAnimation>) {
        this.animations = animations;
        this.texture = new TextureLoader().load(path);
        const spriteMaterial = new MeshBasicMaterial({ map: this.texture, side: DoubleSide, transparent: true });
        this.size = size;
        this.frames = Object.values(this.animations).map(animation => animation.end).reduce((a, b) => Math.max(a, b)) + 1;
        this.texture.wrapS = RepeatWrapping;
        this.texture.magFilter = NearestFilter;
        this.texture.repeat.set(1 / this.frames, 1);
        this.texture.offset.x = this.animationFrameIndex / this.frames;
        const spriteGeometry = new PlaneGeometry(this.size, this.size, 1, 1);
        this.mesh = new Mesh(spriteGeometry, spriteMaterial);
        this.setAnimation(Object.keys(animations)[0]);
    }

    public randomAnimation(): SpriteAnimation {
        const animations = Object.keys(this.animations);
        const animationId = animations[Math.floor(Math.random() * animations.length)];
        console.log(animationId);
        return this.setAnimation(animationId);
    }

    public setAnimation(animationId: string, direction?: AnimatedSpriteDirection): SpriteAnimation {
        const newAnimation = this.animations[animationId];
        if (newAnimation) {
            this.currentAnimation = newAnimation;
            this.mesh.scale.x = direction || 1;
            this.animationFrameIndex = newAnimation.start;
            this.animationStartTime = performance.now() + this.currentAnimation.speed;
            this.texture.offset.x = this.animationFrameIndex / this.frames;
        }
        return this.currentAnimation;
    }

    public update(time: number) {
        if (this.animationStartTime < time) {
            this.animationFrameIndex += 1;
            if (this.animationFrameIndex > this.currentAnimation.end) {
                this.animationFrameIndex = this.currentAnimation.start;
            }
            this.animationStartTime = time + this.currentAnimation.speed;
            this.texture.offset.x = this.animationFrameIndex / this.frames;
        }
    }

    public dispose() {
        this.mesh.geometry.dispose();
    }
}

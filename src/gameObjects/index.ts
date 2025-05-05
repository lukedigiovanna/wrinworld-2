import { Camera } from "../rendering/camera";
import { Component, ComponentFactory, ComponentID } from "../components/index";
import { Vector, Rectangle, MathUtils, Color } from "../utils";
import { Renderer } from "../rendering/renderers";
import { Game, getChunkIndex } from "../game";
import settings from "../settings";
import { Tile, TileData } from "../tiles";
import { ArealEffect } from "arealEffect";

enum Team {
    UNTEAMED,
    PLAYER,
    ENEMY,
}

class GameObject {
    public position: Vector;
    public scale: Vector;
    public rotation: number = 0;
    public rotationPointOffset: Vector;
    public zIndex: number = 0;

    public lifespan: number | undefined = undefined;

    public tag: string = "object"; // default tag is just 'object'

    private _birthTime: number = 0;
    
    private components: Component[] = [];
    
    public renderer: Renderer | undefined = undefined;
    public castsShadow: boolean = false;
    public shadowSize: number = 8;
    public color: Color = Color.WHITE;

    private _game: Game | undefined;

    public storedInChunkIndex = -1;

    private _started: boolean = false;
    private _destroyed: boolean = false;

    public team: Team = Team.UNTEAMED;

    constructor() {
        this.position = Vector.zero();
        this.scale = new Vector(1, 1);
        this.rotationPointOffset = Vector.zero();
    }

    public get game(): Game {
        if (!this._game) {
            throw Error("Cannot acquire the game field of an object not in a game!");
        }
        return this._game;
    }

    public set game(t: Game) {
        this._game = t;
        this._birthTime = this._game.time;
    }

    public get age() {
        return this._game?.time as number - this._birthTime;
    }

    public get destroyed() {
        return this._destroyed;
    }

    public get started() {
        return this._started;
    }

    public get chunkIndex() {
        // transform position into chunk index
        return getChunkIndex(this.position);
    }

    public onHitboxCollisionEnter(collision: GameObject) {
        this.components.forEach((component: Component) => {
            if (component.onHitboxCollisionEnter) {
                component.onHitboxCollisionEnter(collision);
            }
        });
    }

    public onHitboxCollisionExit(collision: GameObject) {
        this.components.forEach((component: Component) => {
            if (component.onHitboxCollisionExit) {
                component.onHitboxCollisionExit(collision);
            }
        });
    }

    public onPhysicalCollision(collision: GameObject | TileData, isTile: boolean) {
        this.components.forEach((component: Component) => {
            if (component.onPhysicalCollision) {
                component.onPhysicalCollision(collision, isTile);
            }
        });
    }

    public render(camera: Camera) {
        if (this.renderer) {
            this.renderer.render(camera, this);
        }
        
        this.components.forEach((component: Component) => {
            if (component.render) {
                component.render(camera);
            }
            if (component.debugRender) {
                component.debugRender(camera);
            }
        });

        if (settings.showObjectCenters) {
            // camera.setFillColor("black");
            // camera.fillEllipse(this.position.x, this.position.y, 0.2, 0.2);
            // camera.setFillColor("magenta");
            // camera.fillEllipse(this.position.x, this.position.y, 0.15, 0.15);
        }
        if (settings.showRotationPoint) {
            // const point = Vector.add(this.position, this.rotationPointOffset);
            // camera.setFillColor("black");
            // camera.fillEllipse(point.x, point.y, 0.2, 0.2);
            // camera.setFillColor("yellow");
            // camera.fillEllipse(point.x, point.y, 0.15, 0.15);
        }
    }

    public addComponent(componentFactory: ComponentFactory): Component {
        if (this._started) {
            throw Error("Cannot add component after GameObject has already started");
        }
        const newComponent = componentFactory(this);
        this.components.push(newComponent);
        return newComponent;
    }

    public getComponentOptional(componentID: ComponentID): Component | undefined {
        for (let i = 0; i < this.components.length; i++) {
            if (componentID === this.components[i].id) {
                return this.components[i];
            }
        }
        return undefined;
    }

    public getComponent(componentID: ComponentID): Component {
        const component = this.getComponentOptional(componentID);
        if (!component) {
            throw new Error("No component found with ID " + componentID + ". Hint: if existence is conditional use hasComponent first");
        }    
        return component;
    }


    public hasComponent(componentID: ComponentID): boolean {
        for (let i = 0; i < this.components.length; i++) {
            if (componentID === this.components[i].id) {
                return true;
            }
        }
        return false;
    }

    public update(dt: number) {
        // check if we changed chunk indexes
        for (const component of this.components) {
            if (this._destroyed) {
                break;
            }
            try {
                component.update?.(dt);
            }
            catch (e) {
                console.error(e);
                throw Error(`
message: ${e}
component id: ${component.id}
object tag: ${this.tag}
age: ${this.age}
position: ${this.position.x}, ${this.position.y}
stack trace:`)
            }
        }
        
        if (this.lifespan && this.age >= this.lifespan) {
            this.destroy();
        }

        const currentCI = this.chunkIndex;
        if (currentCI !== this.storedInChunkIndex) {
            this.game.changeChunk(this, this.storedInChunkIndex); // change our chunk from where we were to where we are.
        }
    } 

    public start() {
        this.components.forEach((component: Component) => {
            if (component.start) {
                component.start();
            }
        });
        this._started = true;
    }

    public destroy() {
        if (this._destroyed) {
            return;
        }
        this._destroyed = true;
        this.game.deleteGameObject(this);
        this.components.forEach(component => {
            if (component.destroy)
                component.destroy();
        });
    }

    // gets all objects within a 1 chunk radius of this object
    // NOTE: this could be made more efficient through caching the result!
    // could at least be cached per frame for individual objects
    // better: caching such a collection across objects
    public getAdjacentObjects() {
        return this.game.getAdjacentObjects(this.position);
    }

    // Performs a raycast against all 
    public raycastHitboxes(direction: Vector, ignoreSelfTeam: boolean=true): {hit: GameObject, distance: number} | null {
        const adjacent = this.getAdjacentObjects();
        let closest = null;
        for (let i = 0; i < adjacent.length; i++) {
            const obj = adjacent[i];
            if (ignoreSelfTeam && obj.team === this.team) {
                continue;
            }
            if (obj.hasComponent("hitbox")) {
                const hitbox = obj.getComponent("hitbox");
                const rectangle = Rectangle.from(Vector.add(obj.position, hitbox.data.boxOffset), hitbox.data.boxSize);
                const raycastResult = MathUtils.raycast(this.position, direction, rectangle);
                if (raycastResult !== Infinity && (closest === null || raycastResult < closest.distance)) {
                    closest = { hit: obj, distance: raycastResult };
                }
            }
        }
        return closest;
    }

    public raycastPhysicalColliders(direction: Vector, ignoreSelfTeam: boolean=true): {hit: GameObject, distance: number} | null {
        const adjacent = this.getAdjacentObjects();
        let closest = null;
        for (let i = 0; i < adjacent.length; i++) {
            const obj = adjacent[i];
            if (ignoreSelfTeam && obj.team === this.team) {
                continue;
            }
            if (obj.hasComponent("physical-collider")) {
                const hitbox = obj.getComponent("physical-collider");
                const rectangle = Rectangle.from(Vector.add(obj.position, hitbox.data.boxOffset), hitbox.data.boxSize);
                const raycastResult = MathUtils.raycast(this.position, direction, rectangle);
                if (raycastResult !== Infinity && (closest === null || raycastResult < closest.distance)) {
                    closest = { hit: obj, distance: raycastResult };
                }
            }
        }
        return closest;
    }

    public get hitboxCenter() {
        const hitbox = this.getComponentOptional("hitbox");
        if (hitbox !== undefined) {
            return this.position.plus(hitbox.data.boxOffset);
        }
        else {
            return this.position.copy();
        }
    }

    public hasArealEffect(effect: ArealEffect) {
        const tile = this.game.getTile(this.hitboxCenter);
        return tile.arealEffects?.has(effect);
    }
}

type GameObjectFactory = (...args: any[]) => GameObject;

export { GameObject, GameObjectFactory, Team };
export * from "./Corpse";
export * from "./Enemy";
export * from "./EssenceOrb";
export * from "./EssenceOrbAttack";
export * from "./FlowerPowerPetal";
export * from "./ItemDrop";
export * from "./MeleeAttack";
export * from "./Player";
export * from "./Portal";
export * from "./Projectile";
export * from "./Prop";

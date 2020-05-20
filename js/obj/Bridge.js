import * as THREE from '../libs/three'
import TWEEN from '../libs/tween.js'

import {
    Pool3D
} from '../base/Pool'
import Config from '../base/Config'

import ObjLoader from '../obj/ObjLoader'


export default class Bridge extends THREE.Object3D {
    constructor() {
        super();

        this._len = 0;
        this._dir = 'x';

        this._obj = null;
        this._originPos = new THREE.Vector3();
    }

    set obj(obj) {
        this._obj && Bridge.objLoader.remove(this._obj);
        if(obj) {
            this.add(obj);
            this.len = this._len;
            this.dir = this._dir;
        }
        this._obj = obj;
    }

    get obj() {
        return this._obj;
    }

    set len(t) {
        this._len = t;
        if (this._obj) {
            this._obj.scale.y = (t < 0.001 ? 0.001 : t);
            this._obj.position.y = t / 2;
        }
    }
    get len() {
        return this._len;
    }

    set dir(d) {
        this._dir = d;
        if(this._obj) {
            let thick = Config.bridgeThick;
            if(d == 'x') {
                this._obj.scale.x = thick;
                this._obj.position.x = -thick * 0.5;
                this._obj.scale.z = Config.bridgeWidth;
            } else {
                this._obj.scale.z = thick;
                this._obj.position.z = -thick * 0.5;
                this._obj.scale.x = Config.bridgeWidth;
            }
        }
    }
    get dir() {
        return this._dir;
    }

    init(dir, originPos) {
        this.dir = dir;
        this.len = 0;
        this._originPos.copy(originPos);
        this.position.copy(originPos);
        this.rotation.set(0, 0, 0);
    }

    growTo(t) {
        this.len = t;
    }

    fallDown(bounce, callback) {
        this.len = this._len;

        window.GROUP_VAR.removeByTarget(this.rotation);
        let dest = (this._dir == 'x') ? {
            z: -Math.PI * 0.5
        } : {
            x: Math.PI * 0.5
        };
        let tween = new TWEEN.Tween(this.rotation, window.GROUP_VAR)
            .to(dest, (bounce ? 2 : 1) * Config.bridgeFallDuration)
            // .easing(TWEEN.Easing.Sinusoidal.In)
            .easing(bounce ? TWEEN.Easing.Bounce.Out : TWEEN.Easing.Sinusoidal.In)
            .onComplete(() => {
                callback && callback();
            }).start();
    }

    drop(duration, callback, ease) {
        this.isDrop = true;
        if (this._obj) {
            this._obj.position.y = this._len / 2 - Config.bridgePosOffset;
        }
        if(this._dir == 'x') {
            this.rotation.z = -Math.PI * 0.5;
            this.position.copy(this._originPos);
            this.position.x += Config.bridgePosOffset;
        } else {
            this.rotation.x = Math.PI * 0.5;
            this.position.copy(this._originPos);
            this.position.z += Config.bridgePosOffset;
        }
        window.GROUP_VAR.removeByTarget(this.rotation);
        let dest = (this._dir == 'x') ? {
            z: -Math.PI
        } : {
            x: Math.PI
        };
        let tween1 = new TWEEN.Tween(this.rotation, window.GROUP_VAR)
            .to(dest, duration * 0.35).easing(ease ? ease : TWEEN.Easing.Linear.None);
        dest = (this._dir == 'x') ? {
                z: -Math.PI - 0.5
            } : {
                x: Math.PI + 0.5
            };
        let tween2 = new TWEEN.Tween(this.rotation, window.GROUP_VAR)
            .to(dest, duration * 0.64);
        let tween3 = new TWEEN.Tween(this.position, window.GROUP_VAR).to({
            y: -25
        }, duration * 0.65).easing(TWEEN.Easing.Sinusoidal.In).onComplete(() => {
            callback && callback();
        });
        tween1.chain(tween2, tween3).start();
    }

    stopAllActions() {
        window.GROUP_VAR.removeByTarget(this.position);
        window.GROUP_VAR.removeByTarget(this.rotation);
        window.GROUP_VAR.removeByTarget(this);
    }

    static create(key = 'bridge') {
        let ret = this.pool.get();
        if(!ret._obj) {
            this.loadObj(ret, key);
        }
        return ret;
    }

    static remove(bridge) {
        bridge.isDrop = false;
        bridge.stopAllActions();
        this.removeObj(bridge);
        this.pool.put(bridge);
    }

    static loadObj(bridge, key) {
        this.objLoader.create(key, obj => {
            obj && (bridge.obj = obj);
        })
    }
    static removeObj(bridge) {
        bridge._obj && this.objLoader.remove(bridge._obj);
        bridge._obj = null;        
    }
}

Bridge.pool = new Pool3D();
Bridge.pool.createFunc = () => {
    return new Bridge();
}

Bridge.objLoader = ObjLoader.instance;
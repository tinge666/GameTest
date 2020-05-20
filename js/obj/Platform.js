import * as THREE from '../libs/three'
import TWEEN from '../libs/tween.js'

import {
    Pool3D
} from '../base/Pool'
import Config from '../base/Config'

import ObjLoader from '../obj/ObjLoader'

import MaterialMgr from '../mgr/MaterialMgr'

/**
 * 底座
 * 为使用pool功能, 使用Platform.create创建, 使用Platform.remove移除
 */
export default class Platform extends THREE.Object3D {
    constructor() {
        super();

        this._obj = null;
        this._target = null;

        this._tween = null;
        this._size = 1;
        this._lvl = 2;

        this._dir = 'x';

        this.dontLoadTarget = false;

    }

    set target(target) {
        this._target && Platform.removeTarget(this);
        target && this.add(target);
        this._target = target;
    }
    get target() {
        return this._target;
    }

    set dir(d) {
        this._dir = d;
        if (d == 'z') {
            this._target.rotation.z = 0;
        } else {
            this._target.rotation.z = Math.PI * 0.5;
        }
    }
    get dir() {
        return this._dir;
    }


    set obj(obj) {
        this._obj && Platform.removeObj(this);
        obj && this.add(obj);
        this._obj = obj;
        this.size = this._size;
    }
    get obj() {
        return this._obj;
    }

    set level(lvl) {
        let w = Config.targetWidth;
        let arr = [5, 5 + 1.5, 5 + 3];
        let s = w * arr[lvl % arr.length];
        this.size = s;
    }
    get level() {
        return this._lvl;
    }

    set size(s) {
        this._size = s;
        if (this._obj) {
            // if(this._obj.unionSize) {
            //     let u = this._obj.unionSize;
            //     let scale = s / u.x;
            //     this._obj.scale.set(scale, scale, scale);
            //     this._obj.position.y = this._obj.geometry.boundingBox.min.z * scale;
            // } else 
            {
                //这里假定了obj尺寸是2*2*2
                this._obj.scale.set(s * 0.5, 3, s * 0.5);
                // this._obj.position.y = -1 * 2;
            }

        }
    }
    get size() {
        return this._size;
    }

    moveUp(bounce, callback) {
        let ySrc = -Config.platformHeight;
        let yDest = 0;
        let duration = Math.abs(yDest - ySrc) / Config.platformMoveSpeed;
        this._tween && window.GROUP_VAR.remove(this._tween);
        this.position.y = ySrc;
        this._tween = new TWEEN.Tween(this.position, window.GROUP_VAR).to({
                y: yDest,
            }, duration)
            // .easing(bounce ? TWEEN.Easing.Back.Out : TWEEN.Easing.Linear.None)
            .easing(bounce ? TWEEN.Easing.Cubic.InOut : TWEEN.Easing.Linear.None)
            .onComplete(() => {
                callback && callback();
            }).start();
    }
    fallDown(duration, y, callback) {
        let ySrc = 0;
        let yDest = y;
        this._tween && window.GROUP_VAR.remove(this._tween);
        this.position.y = ySrc;
        this._tween = new TWEEN.Tween(this.position, window.GROUP_VAR).to({
                y: yDest,
            }, duration)
            .easing(TWEEN.Easing.Quadratic.In)
            .onComplete(() => {
                callback && callback();
            }).start();
    }

    stopMove() {
        if (this._tween) {
            window.GROUP_VAR.remove(this._tween);
            this._tween = null;
        }
    }

    static create(key = 'platform', loadTarget = true) {
        let ret = this.pool.get();
        ret.key = key;
        if (!ret._obj) {
            this.loadObj(ret, key);
        }
        if (!ret._target && loadTarget) {
            this.loadTarget(ret);
        }
        return ret;
    }

    static remove(platform) {
        platform.stopMove();
        this.removeObj(platform);
        this.removeTarget(platform);
        platform.dontLoadTarget = false;
        this.pool.put(platform);
    }

    static loadObj(platform, key) {
        this.objLoader.create(key, obj => {
            if(!obj && key != 'platform') {
                this.loadObj(platform, 'platform');
            } else{
                platform.obj = obj;
            }
        })
    }
    static removeObj(platform) {
        platform._obj && this.objLoader.remove(platform._obj);
        platform._obj = null;
    }

    static loadTarget(platform) {
        let target = this.targetPool.get();
        target.visible = true;
        platform.target = target;
    }
    static removeTarget(platform) {
        platform._target && this.targetPool.put(platform.target);
        platform._target = null;
    }
}

Platform.pool = new Pool3D();
Platform.pool.createFunc = () => {
    return new Platform();
}

Platform.targetPool = new Pool3D();
Platform.targetPool.createFunc = () => {
    let tex = MaterialMgr.getTexture('res/tex/target_tex.png');
    // let tex = new THREE.TextureLoader().load('res/tex/target_tex.png');
    let material = MaterialMgr.getMaterial({
        map: tex,
        transparent: true,
        // side: THREE.DoubleSide,
    });
    // material.blending = THREE.AdditiveBlending;
    
    // if(!material.tween) {
    //     material.opacity = 0;
    //     material.tween = new TWEEN.Tween(material).to({
    //         opacity: 1,
    //     }, 0.5).repeat(Infinity).yoyo(true).start();
    // }

    // let tex2 = MaterialMgr.getTexture('res/tex/target_tex_2.png');
    // let material2 = MaterialMgr.getMaterial({
    //     map: tex2,
    //     transparent: true,
    // });

    let geometry = MaterialMgr.getGeometry('PlaneBufferGeometry', 1, 1, 1, 1);
    // let geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
    let mesh = new THREE.Mesh(geometry, material);
    let scale = Config.targetWidth * 5;
    mesh.scale.set(scale, scale, 1);
    mesh.rotation.x = -Math.PI * 0.5;
    mesh.position.set(0, 0.005, 0);

    return mesh;
}

Platform.objLoader = ObjLoader.instance;
import * as THREE from '../libs/three'

import {
    Pool3D
} from '../base/Pool'
import Config from '../base/Config'

import MaterialMgr from '../mgr/MaterialMgr'


export default class Ruler extends THREE.Object3D {
    constructor() {
        super();

        this._len = 0;
        this._dir = 'x';

        this._obj = null;
        this._originPos = new THREE.Vector3();

        this.createObj();
    }

    createObj() {
        let tex = MaterialMgr.getTexture('res/tex/ruler_tex.png');
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        let material = MaterialMgr.getMaterial({
            map: tex,
            transparent: true,
        });

        let geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
        let ret = new THREE.Mesh(geometry, material);

        this.add(ret);
        this._obj = ret;

        return ret;
    }

    set len(t) {
        this._len = t;
        if (this._obj) {
            this._obj.scale.y = (t < 0.001 ? 0.001 : t);
            this._obj.position.y = t / 2;
            if (this._obj.material && this._obj.material.map) {
                (this._obj.material.map.repeat.y = this._obj.scale.y / Config.bridgeWidth);
            }
        }
    }
    get len() {
        return this._len;
    }

    set dir(d) {
        this._dir = d;
        if(this._obj) {
            if(d == 'x') {
                this._obj.rotation.y = -Math.PI * 0.5;
                this._obj.scale.z = Config.bridgeWidth;
                this.rotation.z = -Math.PI * 0.5;
                this.rotation.x = 0;
            } else {
                this._obj.rotation.y = Math.PI;
                this._obj.scale.x = Config.bridgeWidth;
                this.rotation.x = Math.PI * 0.5;
                this.rotation.z = 0;
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
        this.position.copy(this._originPos);
    }

    static create(key = 'ruler') {
        let ret = this.pool.get();
        return ret;
    }

    static remove(ruler) {
        this.pool.put(ruler);
    }
}

Ruler.pool = new Pool3D();
Ruler.pool.createFunc = () => {
    return new Ruler();
}
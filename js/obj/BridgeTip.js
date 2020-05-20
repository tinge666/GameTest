import * as THREE from '../libs/three'
import TWEEN from '../libs/tween.js'

import {
    Pool3D
} from '../base/Pool'
import Config from '../base/Config'

import ObjLoader from '../obj/ObjLoader'

import MaterialMgr from '../mgr/MaterialMgr'

export default class BridgeTip extends THREE.Object3D {
    constructor() {
        super();

        this._len = 0;
        this._dir = 'x';

        this._originPos = new THREE.Vector3();

        this._bottom = null;
        this._center = null;
        this._top = null;

        this._padding = Config.bridgeWidth * 0.2;
        this._width = Config.bridgeWidth + this._padding;
        this._height = this._width;

        this.createBottom();
        this.createCenter();
        this.createTop();
    }

    _createPlane(img, repeat = false) {
        // let loader = new THREE.TextureLoader();
        // let tex = loader.load(img);
        let tex = MaterialMgr.getTexture(img);
        if(repeat) {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
        }

        let material = MaterialMgr.getBasicMaterial({
            map: tex,
            transparent: true,
        });

        let geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
        let ret = new THREE.Mesh(geometry, material);

        this.add(ret);

        return ret;
    }

    createBottom() {
        let ret = this._createPlane('res/tex/bridge_tip_top.png')
        ret.scale.x = this._width;
        ret.scale.y = -this._width * 0.5;
        ret.position.y = this._width * 0.25;

        this._bottom = ret;
        return ret;
    }

    createCenter() {
        let ret = this._createPlane('res/tex/bridge_tip_center.png', true);
        ret.scale.x = this._width;
        ret.scale.y = this._width;
        ret.position.y = this._width * 0.5;

        this._center = ret;
        return ret;
    }

    createTop() {
        let ret = this._createPlane('res/tex/bridge_tip_top.png');
        ret.scale.x = this._width;
        ret.scale.y = this._width * 0.5;
        ret.position.y = this._width * 0.25;

        this._top = ret;
        return ret;
    }

    set len(t) {
        this._len = t;
        this._height = t + this._padding;
        this._center.scale.y = this._height - this._width;
        this._center.position.y = this._height * 0.5;
        this._center.material.map.repeat.y = (this._height - this._width) / this._width;
        this._top.position.y = this._height - this._width * 0.25;
    }
    get len() {
        return this._len;
    }

    set dir(d) {
        this._dir = d;

        if(d == 'x') {
            this.rotation.y = -Math.PI * 0.5;
            // this._center.position.x = -0.01;
        } else {
            this.rotation.y = -Math.PI;
            // this._center.position.z = -0.01;
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
    }

    static create(key = 'bridgeTip') {
        let ret = this.pool.get();
        return ret;
    }

    static remove(tip) {
        this.pool.put(tip);
    }
}

BridgeTip.pool = new Pool3D();
BridgeTip.pool.createFunc = () => {
    return new BridgeTip();
}
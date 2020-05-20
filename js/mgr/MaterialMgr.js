import * as THREE from '../libs/three'

import {
    Pool
} from '../base/Pool'

export default class MaterialMgr {
    constructor() {
    }


    static _createKey(param) {
        let arr = [];
        for(let a in param) {
            let p = param[a];
            let str = typeof p == 'object' ? (p.id != undefined ? p.id : p.toString ? p.toString() : '') : (p + '');
            arr.push(a + str);
        }
        arr.sort();
        return arr.join('');
    }

    static getMaterial(param) {
        let key = this._createKey(param);
        // console.log('param:', param, ' key:', key);
        let material = this._map.get(key);
        // console.log('param:', param, '结果:', material ? '使用已有材质' : '创建新材质');
        if(!material){
            material = new THREE.MeshPhongMaterial(param);
            this._map.set(key, material);
        }
        return material;
    }

    static getBasicMaterial(param) {
        let key = this._createKey(param);
        // console.log('param:', param, ' key:', key);
        let material = this._map.get(key);
        // console.log('param:', param, '结果:', material ? '使用已有材质' : '创建新材质');
        if(!material){
            material = new THREE.MeshBasicMaterial(param);
            this._map.set(key, material);
        }
        return material;
    }

    static getGrayMaterial() {
        if(!this._grayMaterial){
            this._grayMaterial = new THREE.MeshBasicMaterial({
                color: 0xea7bd9,
                skinning: true,
            });
        }
        return this._grayMaterial;
    }

    static getTexture(url) {
        let tex = this._texMap.get(url);
        if(!tex) {
            let loader = new THREE.TextureLoader();
            tex = loader.load(url);
            this._texMap.set(url, tex);
        }
        return tex;
    }

    static getGeometry(type, ...param) {
        let key = type;
        param.forEach(o => {
            key = key + o;
        });
        let geo = this._geoMap.get(key);
        if(!geo) {
            geo = new THREE[type](...param);
        }
        return geo;
    }
}

MaterialMgr._map = new Map();
MaterialMgr._texMap = new Map();
MaterialMgr._geoMap = new Map();
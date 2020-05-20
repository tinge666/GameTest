import * as THREE from '../libs/three'
import TWEEN from '../libs/tween.js'

import {
    Pool3D
} from '../base/Pool'
import Config from '../base/Config'

import ObjLoader from '../obj/ObjLoader'


export default class Character extends THREE.Object3D {
    constructor() {
        super();

        // this._key = '';
        this._obj = null;
        this._action = '';

        this._zoom = 1;

        this.pIndex = undefined;

    }

    playActionWithIndex(i) {
        if(this._obj && this._obj.clips && this._obj.mixer){
            let clip = this._obj.clips[i];
            if(clip) {
                let action = this._obj.mixer.clipAction(clip);
                action && action.play();
            }
        }
    }

    playAction(name) {
        this.stopAllActions();
        this._action = name;
        if(name && this._obj && this._obj.clips && this._obj.mixer) {
            let clip = THREE.AnimationClip.findByName(this._obj.clips, name);
            if(clip) {
                let action = this._obj.mixer.clipAction(clip);
                action && action.play();
            }
        }
    }

    stopAction(name) {
        this._action = '';
        if(name && this._obj && this._obj.clips && this._obj.mixer) {
            let clip = THREE.AnimationClip.findByName(this._obj.clips, name);
            if(clip) {
                let action = this._obj.mixer.clipAction(clip);
                action && action.stop();
            }
        }
    }

    stopAllActions() {
        this._action = '';
        // if(this._obj && this._obj.mixer) {
        //     this._obj.mixer.stopAllAction();
        // }
        if(this._obj && this._obj.clips && this._obj.mixer) {
            this._obj.clips.forEach(clip => {
                if(clip) {
                    let action = this._obj.mixer.clipAction(clip);
                    action && action.stop();
                }
            })
        }
    }
  
    set obj(obj) {
        this._obj && Character.objLoader.remove(this._obj);
        obj && this.add(obj);
        this._obj = obj;
        obj && this._action && this.playAction(this._action);
    }

    get obj() {
        return this._obj;
    }

    set zoom(s) {
        this.scale.set(s, s, s);
        this._zoom = s;
    }
    get zoom () {
        return this._zoom;
    }

    turnToAngle(angle, duration, callback) {
        if(angle != this.rotation.y) {
            window.GROUP_VAR.removeByTarget(this.rotation);
            new TWEEN.Tween(this.rotation, window.GROUP_VAR).to({
                y: angle,
            }, duration).onComplete(() => {
                callback && callback();
            }).start();
        } else {
            callback && callback();
        }
    }

    delayTodo(delay, callback) {
        window.GROUP_VAR.removeByTarget(this);
        new TWEEN.Tween(this, window.GROUP_VAR).to({}, delay).onComplete(() => {
            callback && callback();
        }).start();
    }

    appear(duration, callback) {
        window.GROUP_VAR.removeByTarget(this.scale, window.GROUP_VAR);
        this.scale.set(0.01, 0.01, 0.01);
        this.visible = true;
        new TWEEN.Tween(this.scale, window.GROUP_VAR).to({
            x: this._zoom,
            y: this._zoom,
            z: this._zoom,
        }, duration).easing(TWEEN.Easing.Bounce.Out).onComplete(() => {
            callback && callback();
        }).start();
    }

    turnToDir(dir, duration, callback) {
        this._dir = dir;
        let angle = this.dir2Angle(dir);
        this.turnToAngle(angle, duration, callback);
    }

    dir2Angle(dir) {
        return (dir == 'x') ? Math.PI * 0.5 : 0;;
    }

    isDirCorrect(dir) {
        return Math.abs(this.rotation.y - this.dir2Angle(dir)) < 0.08;
    }

    moveTo(pos, speed, callback) {
        let duration = this.position.distanceTo(pos) / speed;
        window.GROUP_VAR.removeByTarget(this.position);
        new TWEEN.Tween(this.position, window.GROUP_VAR).to({
            x: pos.x,
            y: pos.y,
            z: pos.z
        }, duration).onComplete(() => {
            callback && callback();
        }).start();

        return duration;
    }

    fallDown(duration, y, callback) {
        let ySrc = 0;
        let yDest = y;
        window.GROUP_VAR.removeByTarget(this.position);
        this.position.y = ySrc;
        this._tween = new TWEEN.Tween(this.position, window.GROUP_VAR).to({
                y: yDest,
            }, duration)
            .easing(TWEEN.Easing.Quadratic.In)
            .onComplete(() => {
                callback && callback();
            }).start();
    }

    removeAllTweens() {
        window.GROUP_VAR.removeByTarget(this);
        window.GROUP_VAR.removeByTarget(this.scale);
        window.GROUP_VAR.removeByTarget(this.position);
        window.GROUP_VAR.removeByTarget(this.rotation);
    }

    set dir(dir) {
        this._dir = dir;
        let angle = this.dir2Angle(dir);
        this.rotation.y = angle;
    }

    get dir() {
        return this._dir;
    }


    static update(t) {
        this.instanceList.forEach(c => {
            c.visible && c._obj && c._obj.visible && 
            c._obj.mixer && c._obj.mixer.update(t);
        })
    }

    static createHero() {
        return this.create('hero');
    }

    static createPet() {
        return this.create('pet');
    }

    static create(key) {
        // let pool = this.getPool(key);
        let ret = Character.pool.get();
        // ret._key = key;
        ret.pIndex = undefined;
        if(key && (!ret._obj || ret._obj.key != key)) {
            this.loadObj(ret, key);
        }
        this.instanceList.push(ret);
        ret.removeAllTweens();
        ret.stopAllActions();
        return ret;
    }

    static remove(character) {
        character.removeAllTweens();
        character.stopAllActions();
        character.pIndex = undefined;
        character._dir = '';
        let index = this.instanceList.indexOf(character);
        if(index != -1) {
            this.instanceList.splice(index, 1);
        }
        this.removeObj(character);
        // let key = character._key;
        // let pool = this.getPool(key);
        Character.pool.put(character);
    }

    static loadObj(character, key) {
        // character._key = key;
        this.objLoader.create(key, obj => {
            if(!obj && key != 'character') {
                this.loadObj(character, 'character');
            } else{
                obj && (character.obj = obj);
            }
        }, false)
    }
    static removeObj(character) {
        character._obj && this.objLoader.remove(character._obj);
        character._obj = null;
    }

    // static getPool(key) {
    //     let pool = this.poolMap.get(key);
    //     if(!pool) {
    //         pool = new Pool3D();
    //         this.poolMap.set(key, pool);
    //         pool.createFunc = () => {
    //             let c = new Character();
    //             return c;
    //         }
    //     }
    //     return pool;
    // }

}


Character.instanceList = [];

// Character.poolMap = new Map();
Character.pool = new Pool3D();
Character.pool.createFunc = () => {
    let c = new Character();
    return c;
}

Character.objLoader = ObjLoader.instance;
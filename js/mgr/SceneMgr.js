import * as THREE from '../libs/three'

import TWEEN from '../libs/tween.js'
import SPE from '../libs/SPE'

import Character from '../obj/Character'
import Platform from '../obj/Platform'
import Bridge from '../obj/Bridge'
import Ruler from '../obj/Ruler'
import BridgeTip from '../obj/BridgeTip'
import ObjLoader from '../obj/ObjLoader'

import Config from '../base/Config'
import Utils from '../base/Utils'

let v3Temp1 = new THREE.Vector3();
let v3Temp2 = new THREE.Vector3();
let v3Temp3 = new THREE.Vector3();

//3D场景管理, 用于创建并定位物体
export default class SceneMgr {
    constructor(scene) {
        this._scene = scene;

        this._stage = new THREE.Object3D();
        scene.add(this._stage);

        this.hero = null;
        this.petList = [];
        this.bridgeList = [];
        this.platformList = [];
        this.ruler = null;
        this.bridgeTip = null;

        this.initParticle();
    }

    //创建一个底座
    createPlatform(key, cur, dir, lvl, dis) {
        
        //创建
        let p = Platform.create(key);
        // let p = Platform.create();
        this.platformList.push(p);
        this._stage.add(p);

        // p.rotation.y = -Math.PI;
        
        //方向
        let prop = dir == 'z' ? 'z' : 'x';
        p.dir = prop;
        
        //定位
        let position = v3Temp1.set(0, 0, 0);
        if(cur) {
            position.copy(cur.position);
            // position[prop] += Math.random() * 20 + 10;
            position[prop] += dis;
        }
        p.position.copy(position);

        //尺寸
        // p.size = Math.random() * 3 + 4;
        // p.level = Utils.rnd_int(0, 2);
        p.level = lvl;
        // p.level = 0;

        return p;
    }

    //在当前底座上 创建桥
    createBridge(cur, next) {

        //方向
        let prop = next.dir == 'z' ? 'z' : 'x';

        //创建
        let b = Bridge.create();
        this.bridgeList.push(b);
        this._stage.add(b);

        //定位
        let position = v3Temp1.copy(cur.position);
        position[prop] += (cur.size * 0.5 - Config.bridgePosOffset);
        b.init(prop, position);

        return b;
    }

    //创建尺子
    createRuler(cur, next) {
        //方向
        let prop = next.dir == 'z' ? 'z' : 'x';

        //创建
        let r = Ruler.create();
        this.ruler = r;
        this._stage.add(r);

        //定位
        let position = v3Temp1.copy(cur.position);
        position.y += 0.02;
        position[prop] += (cur.size * 0.5 - Config.bridgePosOffset);
        r.init(prop, position);

        return r;
    }

    removeBridge(bridge) {
        let index = this.bridgeList.indexOf(bridge);
        if(index > -1) {
            this.bridgeList.splice(index, 1);
        }
        Bridge.remove(bridge);
    }

    removeRuler() {
        if(this.ruler) {
            Ruler.remove(this.ruler);
        }
        this.ruler = null;
    }

    createBridgeTip(dir, pos, len) {
        let t = BridgeTip.create();
        this.bridgeTip = t;
        this._stage.add(t);

        t.init(dir, pos);
        t.len = len;

        return t;
    }

    removeBridgeTip() {
        if(this.bridgeTip){
            BridgeTip.remove(this.bridgeTip);
        }
        this.bridgeTip = null;
    }

    // 创建主角
    createHero() {
        // let c = Character.createHero();
        let c = Character.create(Utils.model('hero'));
        c.playAction('Wait');
        // c.scale.set(2, 2, 2);
        c.zoom = Config.heroZoom;
        this.hero = c;
        this._stage.add(c);
        return c;
    }

    // 创建一个宠物
    //TODO: 据主题创建宠物
    createPet(key) {
        // let p = Character.createPet();
        key = key || 'pet';
        let p = Character.create(key);
        ObjLoader.instance.setNormalMaterial(p);
        p.playAction('Wait');
        // p.scale.set(1, 1, 1);
        p.zoom = Config.petZoom;
        this.petList.push(p);
        this._stage.add(p);
        return p;
    }

    fallDown(duration, depth, callback) {
        let ySrc = 0;
        let yDest = -depth;
        TWEEN.removeByTarget(this._stage);
        this._stage.position.y = ySrc;
        new TWEEN.Tween(this._stage.position).to({
                y: yDest,
            }, duration)
            .easing(TWEEN.Easing.Quadratic.In)
            .onComplete(() => {
                callback && callback();
            }).start();
    }

    //清空所有物体
    clear() {
        this._stage.position.set(0, 0, 0);
        this.hero && Character.remove(this.hero);
        this.petList.forEach(p => Character.remove(p));
        this.bridgeList.forEach(b => Bridge.remove(b));
        this.platformList.forEach(p => Platform.remove(p));
        this.ruler && Ruler.remove(this.ruler);
        this.bridgeTip && BridgeTip.remove(this.bridgeTip);
        this.hero = null;
        this.petList = [];
        this.bridgeList = [];
        this.platformList = [];
        this.ruler = null;
        this.bridgeTip = null;
    }

    setBg(file, duration) {
        if(this._bg == file) {
            return;
        }

        let main = window.main;
        if(!main) {
            return;
        }

        let scene = main.bgScene;
        
        new THREE.TextureLoader().load(file, tex => {
            let material = new THREE.SpriteMaterial({
                map: tex,
                opacity: 0,
            });
    
            let sp = new THREE.Sprite(material);
            sp.position.set(0, 0, -1);
            scene.add(sp);

            new TWEEN.Tween(material).to({
                opacity: 1,
            }, duration).onComplete(() => {
                scene.background = tex;
                scene.remove(sp);
            }).start();
        });
        
        this._bg = file;
    }

    //隐藏超出范围的平台
    hidePlatformOutRange(platform) {
        let index = this.platformList.indexOf(platform);
        if(index > -1) {
            let hideRange = 6;
            this.platformList.forEach((o, i) => {
                if(Math.abs(index - i) >= hideRange) {
                    if(o._obj) {
                        Platform.removeObj(o);
                    }
                    if(o._target) {
                        Platform.removeTarget(o);
                    }
                } else {
                    if(!o._obj) {
                        Platform.loadObj(o, o.key);
                    }
                    if(!o._target && !o.dontLoadTarget) {
                        Platform.loadTarget(o);
                    }
                }
            })
        }
    }

    initParticle() {
        SPE.valueOverLifetimeLength = 3;
        
        let tex = new THREE.TextureLoader().load('res/tex/cubes.png');
        this._particle = new SPE.Group({
            texture: {
                value: tex,
                frames: new THREE.Vector2(3, 3),
                frameCount: 9
            },
            maxParticleCount: 80,
            colorize: false,
            depthTest: false,
            depthWrite: false,
            fog: false,
            blending: THREE.NormalBlending,
            hasPerspective: false,
            // scale: 0.1
        });
        let emitterSetting = {
            type: SPE.distributions.SPHERE,
            position: {
                spread: new THREE.Vector3(3),
                radius: 0.5
            },
            velocity: {
                value: new THREE.Vector3(18, 40, 18),
                spread: new THREE.Vector3(2, 0, 2)
            },
            size: {
                value: [40 * window.devicePixelRatio, 10 * window.devicePixelRatio]
            },
            opacity: {
                value: [1, .5]
            },
            particleCount: 10,
            duration: .3,
            maxAge: {
                value: .5
            }
        };
        this._particle.addPool(2, emitterSetting, false);
        this._particle.mesh.frustumCulled = false;
        this._scene.add(this._particle.mesh);
    }

    showParticle(pos) {
        this._particle.mesh.visible = true;
        this._particle.triggerPoolEmitter(1, pos);
    }

    update(dt) {
        this._particle.tick();
    }

}

// SceneMgr
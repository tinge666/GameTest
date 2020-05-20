import * as PIXI from '../libs/pixi'
import * as THREE from '../libs/three'

import TWEEN from '../libs/tween.js'

import Config from '../base/Config'
import Utils from '../base/Utils'
import {
    Pool
} from '../base/Pool'

import Character from '../obj/Character'
import Platform from '../obj/Platform'
import ObjLoader from '../obj/ObjLoader';


import TouchMgr from '../mgr/TouchMgr'
import CameraMgr from '../mgr/CameraMgr'
import SceneMgr from '../mgr/SceneMgr'
import SoundMgr from '../mgr/SoundMgr'
import LevelMgr from '../mgr/LevelMgr'

import GameUi from '../ui/GameUi'

import DataBus from '../runtime/DataBus'
import Main from '../runtime/main.js';

let v3Temp1 = new THREE.Vector3();
let v3Temp2 = new THREE.Vector3();
let v3Temp3 = new THREE.Vector3();

export default class ShopSceneMgr {
    static show(onBattle, onClose, gift) {
        window.main.switchToScene(Main.SceneType.Shop);
        this._scene = window.main.shopScene;
        this._camera = window.main.shopCamera;

        this.createRoot();
        this.createPlatform();
        this.createPet();
        // console.log('this._pet:', this._pet);
        // console.log('this._platform:', this._platform);

        SDK.showLoading('加载中...');
        GameUi.removeLayer('Shop');
        let layer = GameUi.showShopLayer();

        layer.onBattle = onBattle;
        layer.onClose = () => {
            this.hide();
            onClose && onClose();
        }
        layer.onSelectPet = (i, isGray) => {
            let obj = LevelMgr.getPetData(i);
            let key = Utils.model(obj.pet);
            if(!this._pet._obj || this._pet._obj.key != key) {
                Character.loadObj(this._pet, key);
            }
            if(isGray) {
                ObjLoader.instance.setGrayMaterial(this._pet);
            } else {
                ObjLoader.instance.setNormalMaterial(this._pet);
            }
            this._pitch.rotation.x = 0;
            this._yaw.rotation.y = 0;
        }
        layer.onTouchMove = o => {
            let {
                dx, dy, x, y, ox, oy
            } = o;
            this._pitch.rotation.x += dy / 300;
            this._pitch.rotation.x = Math.min(Math.PI * 0.25, Math.max(-Math.PI * 0.25, this._pitch.rotation.x));
            this._yaw.rotation.y += dx / 300;
        }

        gift == undefined && (gift = DataBus.giftList[0]);
        if(gift != undefined) {
            layer.setBattleLvl(gift);
        } else {
            let unlockIndex = DataBus.petList[0];
            if(unlockIndex != undefined) {
                layer.selectBtn(unlockIndex);
            } else {
                layer.setBattleLvl(0);
            }
        }
    }

    static hide() {
        window.main.switchToScene(Main.SceneType.Normal);
    }

    static createRoot() {
        let createObj = (parent) => {
            let obj = new THREE.Object3D();
            parent.add(obj);
            return obj;
        }
        //俯仰
        if(!this._pitch) {
            this._pitch = createObj(this._scene);
        }
        //偏向
        if(!this._yaw) {
            this._yaw = createObj(this._pitch);
        }
        //根节点
        if(!this._root) {
            this._root = createObj(this._yaw);
        }
        return this._root;
    }

    static createPet() {
        if(!this._pet) {
            let c = Character.create();
            this._root.add(c);
            c.visible = true;
            c.position.set(0, 0, 0);
            c.scale.set(1, 1, 1);
            c.rotation.y = -Math.PI * 0.25;

            c.playAction('Wait');
            this._pet = c;
        }
        return this._pet;
    }

    static createPlatform() {
        if(!this._platform) {
            let model = Utils.model(LevelMgr.getPlatformModel());
            let p = Platform.create(model, false);
            p.target = null;
            p.level = 0;
            p.scale.set(0.7, 0.5, 0.7);
            p.position.set(0, 0, 0);
            p.rotation.y = Math.PI * 0.25;
            this._root.add(p);
            this._platform = p;
        }
        return this._platform;
    }

}

window.ShopSceneMgr = ShopSceneMgr;
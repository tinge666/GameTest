import * as THREE from '../libs/three'
import TWEEN from '../libs/tween.js'

import DataBus from '../runtime/DataBus'

import Config from '../base/Config'
import Utils from '../base/Utils'

let v3Temp1 = new THREE.Vector3();
let v3Temp2 = new THREE.Vector3();
let v3Temp3 = new THREE.Vector3();

const halfRoot2 = 0.7071067811865475;

//镜头管理, 用于处理镜头的缩放, 移动, 指向
export default class CameraMgr {
    constructor(camera, light) {
        this._camera = camera;
        this._light = light;
        this._tween1 = null;
    }

    /**
     * TODO: 使镜头缩放并对准物体(一个或两个), 立即对准或动画对准
     * @param {*} obj1 物体或坐标
     * @param {*} obj2 物体或坐标或空
     * @param {*} padding1 物体或坐标两端留空
     * @param {*} padding2 物体或坐标两端留空
     * @param {*} ani 是否显示动画
     * @param {*} callback 动画完成后回调
     */
    lookAt(obj1, obj2 = null, padding1 = 0, padding2 = 0, ani = true, callback = null) {
        let camera = this._camera;
        let pos1 = obj1 ? (obj1.position ? obj1.position : obj1) : null;
        let pos2 = obj2 ? (obj2.position ? obj2.position : obj2) : null;

        let zoom = 1;
        if (pos1 && pos2) {
            //两物体间向量
            v3Temp2.copy(pos2).sub(pos1);
            //两物体中点
            v3Temp1.copy(pos2).add(pos1).multiplyScalar(0.5).add(
                v3Temp3.copy(v3Temp2).normalize().multiplyScalar(
                    (padding2 - padding1) * halfRoot2
                )
            );
            //两物体横向距离(镜头显示中的横向)
            let horiOffset = Math.abs(v3Temp2.dot(v3Temp3.set(-halfRoot2, 0, halfRoot2)));
            // console.log('两点间距: ', horiOffset);
            // console.log('相机显示宽度: ', camera.right - camera.left);
            zoom = (camera.right - camera.left) / (horiOffset + padding1 + padding2);
        } else if (pos1) {
            v3Temp1.copy(pos1);
            zoom = 1;
        } else if (pos2) {
            v3Temp1.copy(pos2);
            zoom = 1;
        } else {
            v3Temp1.set(0, 0, 0);
            zoom = 1;
        }
        
        if (ani) {
            let duration = Config.cameraMoveDuration;
            
            let op = v3Temp3.set(45, -45, 45).add(camera.position);
            let oz = camera.zoom;
            this._tween1 && window.GROUP_VAR.remove(this._tween1);
            this._tween1 = new TWEEN.Tween({
                x: op.x,
                y: op.y,
                z: op.z,
                zoom: oz,
            }, window.GROUP_VAR).to({
                x: v3Temp1.x,
                y: v3Temp1.y,
                z: v3Temp1.z,
                zoom: zoom,
            }, duration).onUpdate(obj => {
                this._udpateCamera(obj, obj.zoom);
            }).onComplete(() => {
                callback && callback();
            }).start();
        } else {
            this._udpateCamera(v3Temp1, zoom);
        }
    }

    _udpateCamera(pos, zoom) {
        this._camera.position.set(-45 + pos.x, 45 + pos.y, -45 + pos.z);
        let oz = this._camera.zoom;
        this._camera.zoom = zoom;
        oz != zoom && this._camera.updateProjectionMatrix();
        this._light.target.position.copy(pos);
        this._light.target.updateMatrix();
        this._light.position.set(pos.x - 70, pos.y + 100, pos.z - 20);
    }

    /**
     * 3D世界坐标到屏幕坐标的转换
     * @param {*} src 
     * @param {*} out 
     */
    getScreenCoord(src, out) {
        Utils.convertOrthographicCoordToScreenCoord(this._camera, src, out);
        return out;
    }
}
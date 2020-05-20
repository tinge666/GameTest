import * as THREE from '../libs/three'
import TWEEN from '../libs/tween.js'

// import '../libs/inflate.min.js'
// import '../libs/FBXLoader'
import '../libs/GLTFLoader'
// import '../libs/WireframeGeometry2'

import MaterialMgr from '../mgr/MaterialMgr'

import {
    Pool3D
} from '../base/Pool'

let b3Temp1 = new THREE.Box3();
let v3Temp1 = new THREE.Vector3();


//用于加载模型
export default class ObjLoader {
    constructor() {
        this.poolMap = new Map();
    }
    create(key, success, cache = true) {
        return this.loadObjFromPool(key, success, cache);
    }
    remove(obj) {
        let pool = this.getPool(obj.key);
        if (obj.mixer) {
            obj.mixer.stopAllAction();
            // obj.mixer.uncacheRoot(mixer.getRoot());
        }
        pool.put(obj);
    }

    getPool(key) {
        let pool = this.poolMap.get(key);
        if (!pool) {
            pool = new Pool3D();
            this.poolMap.set(key, pool);
        }
        return pool;
    }

    loadObjFromPool(key, onLoad, cache = true) {
        let pool = this.getPool(key);
        if (pool.size <= 0) {
            return this.loadObjByKey(key, obj => {
                onLoad && onLoad(obj);
                // if (obj) {
                //     onLoad && onLoad(obj);
                // } else {
                //     this.loadObjByKey('default', onLoad, true);
                // }
            }, cache);
        } else {
            let obj = pool.get();
            console.log(`创建(${key}), 使用pool`);
            onLoad && onLoad(obj);
            return obj;
        }
    }

    cloneObj(obj) {
        let ret = obj.clone(true);
        ret.clips = obj.clips;
        ret.mixer = new THREE.AnimationMixer(ret);
        return ret;
    }

    loadObjByKey(key, onLoad, cache = true) {

        let obj = ObjLoader.cacheMap[key];
        if (obj) {
            // TODO: 复制体是不是需要重新构建动画?
            let ret = this.cloneObj(obj);
            console.log(`创建(${key}), 使用cache`);
            ret.key = key;
            onLoad && onLoad(ret);
            return ret;
        }

        let callback = obj => {
            if (obj && cache) {
                ObjLoader.cacheMap[key] = obj;
                obj = this.cloneObj(obj);
            }
            // console.log('返回新加载的: ', obj);
            console.log(`创建(${key}), 使用新建`);            
            // this._printObj(obj);
            obj && (obj.key = key);
            onLoad && onLoad(obj);
        }

        if (key == 'hero') {
            return this._loadObjForHero(callback);
        } else if (key == 'pet') {
            return this._loadObjForPet(callback);
        } else if (key == 'platform') {
            return this._loadObjForPlatform(callback);
        } else if (key == 'bridge') {
            return this._loadObjForBridge(callback);
        } else if (key == 'ruler') {
            return this._loadObjForRuler(callback);
        } else if (key == 'bridgeTip') {
            return this._loadObjForBridgeTip(callback);
        } else if (key == 'character') {
            return this._loadObjForCharacter(callback);
        } else if (key == 'default') {
            return this._loadDefaultObj(callback);
        } else {
            return this._loadObjFromGLTF(key, callback);
        }
    }

    _loadObjForHero(onLoad) {
        let ret = new THREE.Object3D();

        let material = MaterialMgr.getMaterial({
            color: 0xee9933
        });

        for (let i = 0; i < 2; ++i) {
            let geometry = new THREE.BoxBufferGeometry(0.3, 0.4, 0.3, 1, 1, 1);
            let mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = (i == 0) ? -0.3 : 0.3;
            mesh.position.y = 0.2;
            ret.add(mesh);
        }

        {
            let geometry = new THREE.BoxBufferGeometry(1.0, 0.8, 0.8, 1, 1, 1);
            let mesh = new THREE.Mesh(geometry, material);
            mesh.position.y = 0.5 + 0.4;
            ret.add(mesh);
        }

        for (let i = 0; i < 2; ++i) {
            let geometry = new THREE.BoxBufferGeometry(0.2, 0.7, 0.2, 1, 1, 1);
            let mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = (i == 0) ? -0.8 : 0.8;
            mesh.position.y = 1;
            mesh.rotation.z = (i == 0) ? -Math.PI / 4 : Math.PI / 4;
            ret.add(mesh);
        }

        {
            let geometry = new THREE.SphereBufferGeometry(0.8, 16, 16);
            let mesh = new THREE.Mesh(geometry, material);
            mesh.position.y = 1.8 + 0.8 / 2;
            ret.add(mesh);
        }

        onLoad && onLoad(ret);
        return ret;
    }

    _loadObjForPet(onLoad) {
        let ret = new THREE.Object3D();

        let color = new THREE.Color();
        color.setRGB(Math.random(), Math.random(), Math.random());
        let material = MaterialMgr.getMaterial({
            // color: 0x9933ee
            color: color.getHex(),
        });

        {
            // let geometry = new THREE.BoxBufferGeometry(0.6, 0.6, 0.6, 1, 1, 1);
            let geometry = new THREE.ConeBufferGeometry(0.6, 1.5, 4, 1);
            let mesh = new THREE.Mesh(geometry, material);
            // mesh.position.y = 0.3;
            mesh.position.y = 0.6;
            mesh.rotation.x = Math.PI * 0.5;
            mesh.rotation.y = Math.PI * 0.25;
            ret.add(mesh);
        }

        onLoad && onLoad(ret);
        return ret;
    }

    _loadObjForCharacter(onLoad) {
        let ret = new THREE.Object3D();

        let material = MaterialMgr.getMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.5,
        });

        {
            let geometry = new THREE.BoxBufferGeometry(2, 2, 2, 1, 1, 1);
            let mesh = new THREE.Mesh(geometry, material);
            mesh.position.y = 1;
            ret.add(mesh);
        }

        onLoad && onLoad(ret);
        return ret;
    }

    _loadObjForPlatform(onLoad) {
        let ret = new THREE.Object3D();

        // var loader = new THREE.CubeTextureLoader();
        // loader.setPath( 'res/tex/ball/' );

        // var textureCube = loader.load( [
        //     '040.png', '041.png',
        //     '061.png', '062.png',
        //     '020.png', '042.png'
        // ] );

        let material = MaterialMgr.getMaterial({
            // color: 0x999999
            color: 0x333333
            // color: 0xffffff
            // map: textureCube,
        });

        {
            let geometry = new THREE.BoxBufferGeometry(2, 2, 2, 1, 1, 1);
            let mesh = new THREE.Mesh(geometry, material);
            mesh.position.y = -1;
            ret.add(mesh);
        }

        onLoad && onLoad(ret);
        return ret;
    }

    _loadObjForBridge(onLoad) {
        let ret = new THREE.Object3D();

        let material = MaterialMgr.getMaterial({
            // color: 0xcc6600,
            // opacity: 0.5,
            // transparent: true,
            color: 0xccccb0,
        });

        {
            let geometry = new THREE.BoxBufferGeometry(1, 1, 1, 1, 5, 1);
            let mesh = new THREE.Mesh(geometry, material);
            ret.add(mesh);
        }

        onLoad && onLoad(ret);
        return ret;
    }

    _loadObjForRuler(onLoad) {
        let loader = new THREE.TextureLoader();
        let tex = loader.load('res/tex/ruler_tex.png');
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        let material = MaterialMgr.getMaterial({
            map: tex,
        });

        let geometry = new THREE.BoxBufferGeometry(1, 1, 1, 1, 1, 1);
        let ret = new THREE.Mesh(geometry, material);

        onLoad && onLoad(ret);
        return ret;
    }

    _loadObjForBridgeTip(onLoad) {
        let material = new THREE.LineDashedMaterial({
            color: 0xffffff,
            linewidth: 10, // in pixels
            dashSize: 2,
            gapSize: 2,
        });

        let geometry = this._createLineBoxGeometry(1, 1, 1);
        let ret = new THREE.LineSegments(geometry, material);
        ret.computeLineDistances();

        onLoad && onLoad(ret);
        return ret;
    }

    _createLineBoxGeometry(width, height, depth) {
        let ret = new THREE.Geometry();
        let v = ret.vertices;
        let x = width * 0.5,
            y = height * 0.5,
            z = depth * 0.5;

        let a = new THREE.Vector3(x, y, z),
            b = new THREE.Vector3(-x, y, z),
            c = new THREE.Vector3(-x, y, -z),
            d = new THREE.Vector3(x, y, -z),

            e = new THREE.Vector3(x, -y, z),
            f = new THREE.Vector3(-x, -y, z),
            g = new THREE.Vector3(-x, -y, -z),
            h = new THREE.Vector3(x, -y, -z);

        v.push(a, b, b, c, c, d, d, a);
        v.push(e, f, f, g, g, h, h, e);
        v.push(a, e, b, f, c, g, d, h);

        return ret;
    }

    _loadDefaultObj(onLoad) {
        let ret = new THREE.Object3D();

        let material = MaterialMgr.getMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.5,
        });

        {
            let geometry = new THREE.BoxBufferGeometry(2, 2, 2, 1, 1, 1);
            let mesh = new THREE.Mesh(geometry, material);
            ret.add(mesh);
        }

        onLoad && onLoad(ret);
        return ret;
    }

    _loadObjFromGLTF(file, onLoad) {

        let loader = new THREE.GLTFLoader();
        loader.load(file, (gltf) => {
            // console.log(`加载好的gltf(${file}): `, gltf);
            let object = gltf.scene.children[0];
            if (object) {

                object.clips = gltf.animations;
                object.mixer = new THREE.AnimationMixer(object);

                {
                    // console.log(object);
                    // this._printObj(object);

                    // console.log('object: ', file);

                    // let boxes = object.children.map(child => {
                    //     if(child.geometry) {
                    //         child.geometry.computeBoundingBox();
                    //         return child.geometry.boundingBox;
                    //     } else {
                    //         return null;
                    //     }
                    // }).filter(o => o);

                    // console.log('boxes:', boxes);
                    // let sizes = boxes.map(b => {
                    //     let v = new THREE.Vector3();
                    //     b.getSize(v);
                    //     return v;
                    // });
                    // console.log('sizes:', sizes);
                    // b3Temp1.makeEmpty();
                    // boxes.forEach(b => {
                    //     b3Temp1 = b3Temp1.union(b);
                    // })
                    // console.log('union box:', b3Temp1);
                    // b3Temp1.getSize(v3Temp1);
                    // console.log('union size:', v3Temp1);
                    // object.unionSize = (new THREE.Vector3()).copy(v3Temp1);

                    // object.geometry && object.geometry.computeBoundingBox();
                    // object.unionSize = new THREE.Vector3();
                    // object.geometry.boundingBox.getSize(object.unionSize);
                    // console.log('unionSize:', object.unionSize);

                    // object.children.forEach(mesh => {
                    //     // mesh.geometry && mesh.geometry.computeFaceNormals();
                    //     // mesh.material && (mesh.material.color = new THREE.Color(0xffffff));
                    //     // if(mesh.name == 'Cube.yinying') {
                    //     //     mesh.material.side = THREE.BackSide;
                    //     // }
                    // })

                    // console.log('动画:', gltf.animations);

                    // let loader = new THREE.TextureLoader();
                    // let tex = loader.load('res/tex/cubes.png');
                    // tex.wrapS = THREE.RepeatWrapping;
                    // tex.wrapT = THREE.RepeatWrapping;

                    // this._visitObj(object, 0, (obj, depth) => {
                        // if(obj.material) {
                        //     obj.material.side = THREE.DoubleSide;
                        // }
                        // if(obj.parent) {
                        //     obj.parent = null;
                        // }
                        // if(obj.material) {
                            // obj.material.skinning = false;
                            // if(obj.material.isShaderMaterial) {
                            //     console.log('==========isShaderMaterial')
                            // }
                            // obj.material = MaterialMgr.getMaterial({color:0xaaaaaa});
                            // setTimeout(() => {

                                // console.log('原材质: ')
                                // this._printObject(obj.material);
                                
                                // if(obj.material.map) {
                                //     obj.material = new THREE.MeshLambertMaterial({
                                //         // color: obj.material.color,
                                //         map: obj.material.map,
                                //         skinning: true,
                                //         // lights: true,
                                //     })
                                // } else {
                                //     obj.material = new THREE.MeshLambertMaterial({
                                //         color: obj.material.color,
                                //         skinning: true,
                                //     })
                                // }

                                // obj.material = new THREE.MeshPhongMaterial({
                                //     // color: 0xaaaaaa,
                                //     // color: Math.floor(Math.random() * 0xffffff),
                                //     map: obj.material.map,
                                //     // side: THREE.DoubleSide,
                                // })

                                // obj.material = obj.material.clone();

                                // console.log('新材质: ')                                
                                // this._printObject(obj.material);
                                // console.log(obj.name, ': ', obj.material);
                            // }, 1000);
                        // }
                    // });
                    // console.log(object);

                    // console.log('gltf:', JSON.stringify(gltf));
                }

                onLoad && onLoad(object);

            } else {
                onLoad && onLoad(null);
            }
        }, null, res => {
            console.log('加载gltf出错: ', res);
            onLoad && onLoad(null);
        });
    }

    // _loadObjFromFBX(file, onLoad) {
    //     let loader = new THREE.FBXLoader();
    //     loader.load(file, (object) => {
    //         object.mixer = new THREE.AnimationMixer(object);
    //         object.clips = object.animations;

    //         // if (mixer && object.animations) {
    //         //     this._mixer = mixer;

    //         //     this._actions = {};
    //         //     object.animations.forEach((ani, i) => {
    //         //         this._actions[ani.name] = this._actions[i] = mixer.clipAction(ani);
    //         //     })

    //         //     // let action = mixer.clipAction( object.animations[ 0 ] );
    //         //     // action.play();
    //         // } else {
    //         //     this._mixer = null;
    //         //     this._actions = null;
    //         // }

    //         // object.traverse( function ( child ) {
    //         //     if ( child.isMesh ) {
    //         //         child.castShadow = true;
    //         //         child.receiveShadow = true;
    //         //     }
    //         // } );
    //         // this.setObj(object);

    //         onLoad && onLoad(object);
    //     }, null, res => {
    //         console.log('加载fbx出错: ', res);
    //         onLoad && onLoad(null);
    //     });
    // }

    setGrayMaterial(obj) {
        let material = MaterialMgr.getGrayMaterial();
        this._visitObj(obj, 0, (child, depth) => {
            if(child instanceof THREE.Mesh && child.isMesh) {
                if(child.material != material) {
                    child.materialBak = child.material;
                    child.material = material;
                }
            }
        })
    }
    setNormalMaterial(obj) {
        this._visitObj(obj, 0, (child, depth) => {
            if(child instanceof THREE.Mesh && child.isMesh) {
                if(child.materialBak) {
                    child.material = child.materialBak;
                }
            }
        })
    }

    _visitObject(obj, depth, func) {
        if(depth > 10) {
            return;
        }
        for(let i in obj) {
            if(typeof obj[i] == 'object') {
                func && func(i, depth);
                this._visitObject(obj[i], depth + 1, func);
            }
        }
    }
    _printObject(obj) {
        
        let fmt = num => {
            return num.toFixed(2);
        }
        let str = '\n';
        this._visitObject(obj, 0, (name, depth) => {
            str += '  '.repeat(depth);
            str += name;
            str += '\n';
        })
        console.log(str);
    }

    _visitObj (obj, depth, func) {
        func && func(obj, depth);
        Array.isArray(obj.children) && obj.children.forEach(child => {
            this._visitObj(child, depth + 1, func);
        })
    }

    _printObj(obj) {
        
        let fmt = num => {
            return num.toFixed(2);
        }
        let getScale = obj => {
            return ` scale: (${fmt(obj.scale.x)}, ${fmt(obj.scale.y)}, ${fmt(obj.scale.z)})`;
        }
        let str = '\n';
        this._visitObj(obj, 0, (obj, depth) => {
            str += '  '.repeat(depth);
            str += obj.type;
            str += getScale(obj);
            str += '\n';
        })
        console.log(str);
    }
}


ObjLoader.instance = new ObjLoader();
ObjLoader.cacheMap = {};
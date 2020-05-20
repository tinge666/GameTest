import Base64 from '../libs/base64'

import * as PIXI from '../libs/pixi'
import * as THREE from '../libs/three'

import TWEEN from '../libs/tween.js'
import SDK from '../libs/sdk'

// import '../libs/TrackballControls'
// import '../libs/OrbitControls'
// import '../libs/OrthographicTrackballControls'

import DataBus from '../runtime/DataBus'

import Config from '../base/Config'
import Utils from '../base/Utils'

import Character from '../obj/Character'
import Platform from '../obj/Platform'
import Bridge from '../obj/Bridge'

import CameraMgr from '../mgr/CameraMgr'
import GameMgr from '../mgr/GameMgr'

// import Button from '../ui/Button'
import GameUi from '../ui/GameUi'

/**
 * 小游戏没有atob及btoa
 */
if (!window.atob) {
    window.atob = Base64.decode.bind(Base64);
}
if (!window.btoa) {
    window.btoa = Base64.encode.bind(Base64);
}

/**
 * 临时变量
 */
let v3Temp1 = new THREE.Vector3();
let v3Temp2 = new THREE.Vector3();
let v3Temp3 = new THREE.Vector3();
let v3Temp4 = new THREE.Vector3();
let v3Temp5 = new THREE.Vector3();
let colorTemp1 = new THREE.Color();
let colorTemp2 = new THREE.Color();
let quatTemp1 = new THREE.Quaternion();
let quatTemp2 = new THREE.Quaternion();

/**
 * 可变速缓动动画分组
 */
window.GROUP_VAR = new TWEEN.Group();

/**
 * 初始化SDK
 */
SDK.init({
    game_id: 'bridge01',
    game_version: 7,
    videoId: 'adunit-15291c4ca931d720',
    bannerId: 'adunit-3bd5ec547ccf3028',
    autoPullAllConfig: false,   //设置后台切换不自动拉取配置
})

/**
 * 手动拉取其它配置
 */
SDK.pullOtherConfig({
    inside: true,
    wall: false,
    share: true
});

/**
 * 入口类
 */
export default class Main {
    constructor() {

        //2D
        this.app = null;

        //3D
        this.gl = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        this.light = null;
        
        //用于背景切换
        this.bgScene = null;
        this.bgCamera = null;

        //用于商店3D场景
        this.shopScene = null;
        this.shopCamera = null;

        //当前渲染的场景类型
        this._sceneType = Main.SceneType.Normal;

        //帧索引
        this._frameIndex = 0;

        //帧时间
        this._frameTime = 0;

        //动画速度
        this._speed = 1;

        //可变速TWEEN组
        window.GROUP_VAR.now = () => this._frameTime;

        //向导相关

        //初始化游戏
        this.init3D();
        this.init2D();

        //初始化微信
        this.initWx();

        //渲染循环
        this._last = 0;
        this.renderBind = this.render.bind(this);
        this.render();


        //挂载
        window.main = this;

        //初始完成
        this._inited = true;
    }

    initWx() {
        if(!window.wx) {
            return;
        }

        //添加系统转发
        SDK.onShareWithCallback(() => {
            let c = Utils.getShareConfig(Utils.SharePos.System);
            return {
                title: c.title,
                imageUrl: c.pic,
                query: c.queryStr,
            };
        });

        //添加内存监听
        typeof wx.onMemoryWarning == 'function' && wx.onMemoryWarning((res) => {
            console.log('内存警告:', res);
            wx.triggerGC();
        });

        //设置微信菜单按钮风格
        wx.setMenuStyle && wx.setMenuStyle({
            style: "light"
        });

        //设置屏幕常亮
        (typeof wx.setKeepScreenOn == 'function') && wx.setKeepScreenOn({
            keepScreenOn: true,
        });

        //移至GameMgr
        // setTimeout(() => {
        //     wx.onShow(() => {
        //         this.resume();
        //     });
        //     wx.onHide(() => {
        //         this.pause();
        //     });
        // }, 500);
    }

    init3D() {

        let gl = canvas.getContext("webgl", {
            alpha: false,
            antialias: false,
            preserveDrawingBuffer: false,
            premultipliedAlpha: false
        });
        gl.clearColor(0, 0, 0, 1);
        gl.colorMask(true, true, true, true);

        // let t = gl.getContextAttributes();
        // console.log('gl:', t);

        //场景
        let scene = new THREE.Scene();

        //镜头
        // let camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.1, 120);
        let w = 20;
        let h = w / Config.sWidth * Config.sHeight;
        let camera = new THREE.OrthographicCamera(-w * 0.5, w * 0.5,
            h * Config.cameraVOffset, -h * (1 - Config.cameraVOffset), -200, 2000
        );

        camera.up.set(0, 1, 0);
        camera.position.set(-45, 45, -45);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        // camera.updateProjectionMatrix();
        // camera.matrixAutoUpdate = false;


        let renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            context: gl,
            premultipliedAlpha: false,
            alpha: false,
            stencil: false,
        });
        // renderer.setClearColor(new THREE.Color(0x66aacc));
        renderer.setPixelRatio(window.devicePixelRatio);
        // renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.autoClear = false;

        {
            var i = gl.getContextAttributes();
            console.log("gl attributes:", i);
            console.log("gl.MAX_VERTEX_UNIFORM_VECTORS:", gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS));
            console.log("gl.MAX_FRAGMENT_UNIFORM_VECTORS:", gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS));
        }

        // let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);
        // hemiLight.color.setHSL(0.6, 1, 0.6);
        // hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        // hemiLight.position.set(0, 50, 0);
        // scene.add(hemiLight);

        let light;
        
        light = new THREE.AmbientLight(0xffffff, 0.65);
        scene.add(light);

        light = new THREE.DirectionalLight(0xffffff, 0.7);
        light.position.set(-70, 100, -20);
        light.castShadow = true;
        // light.shadow.radius = 0;
        light.shadow.mapSize.set(256, 256);
        light.shadow.camera.left = -1;
        light.shadow.camera.right = 1;
        light.shadow.camera.top = 1;
        light.shadow.camera.bottom = -1;
        light.shadow.camera.near = 1;
        light.shadow.camera.far = 50;
        scene.add(light);

        light.target.matrixAutoUpdate = false;
        scene.add(light.target);

        // scene.fog = new THREE.Fog(new THREE.Color(0xa13f92), 75, 90);

        // let axis = new THREE.AxesHelper(1000);
        // scene.add(axis);

        let controls = null;
        // let controls = new THREE.OrthographicTrackballControls(camera);
        // controls.minDistance = 200;
        // controls.maxDistance = 500;

        {

            this.bgScene = new THREE.Scene();
            this.bgCamera = new THREE.OrthographicCamera(-.5, .5, .5, -.5, -1, 1);

            this.shopScene = new THREE.Scene();
            w = 10;
            h = w / Config.sWidth * Config.sHeight;
            this.shopCamera = new THREE.OrthographicCamera(-w * 0.5, w * 0.5,
                h * 0.35, -h * 0.65, -200, 2000
            );
            this.shopCamera.up.set(0, 1, 0);
            this.shopCamera.position.set(0, 15, 45);
            this.shopCamera.lookAt(new THREE.Vector3(0, 0, 0));
            this.shopScene.add(light.clone());
            this.shopScene.add(new THREE.AmbientLight(0xffffff, 0.65));

            let tex = new THREE.TextureLoader().load('res/ui/unpack/bg.jpg');
            this.bgScene.background = tex;
            // this.bgScene.background = new THREE.Color(0x4b92d4);
        }


        this.gl = gl;
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.light = light;
        this.controls = controls;
    }

    init2D() {
        PIXI.settings.MAX_TEXTURES = 4;
        PIXI.settings.MAX_VERTEX_ATTRIBS = 16;
        PIXI.settings.RESOLUTION = 1;
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;
        PIXI.settings.CAN_UPLOAD_SAME_BUFFER = true;
        PIXI.settings.SPRITE_BATCH_SIZE = 256;
        PIXI.settings.GC_MODE = PIXI.GC_MODES.MANUAL;
        PIXI.settings.MIPMAP_TEXTURES = false;

        let app = new PIXI.Application({
            view: canvas,
            context: this.gl,
            width: window.innerWidth,
            height: window.innerHeight,
            resolution: window.devicePixelRatio,
            forceCanvas: false,
            clearBeforeRender: false,
            roundPixels: false,
            transparent: false,
            legacy: true,
            sharedLoader: true,
            autoStart: false,
            sharedTicker: true,
        });

        app.ticker.autoStart = false;
        app.ticker.stop();
        app.renderer.plugins.interaction.moveWhenInside = true;
        let uiScale = canvas.width / 720 / window.devicePixelRatio;
        console.log("uiScale:", uiScale);
        app.stage.scale.x = uiScale;
        app.stage.scale.y = uiScale;
        window.uiScale = uiScale;

        console.log('canvas width:', canvas.width);
        console.log('window width:', window.innerWidth);
        console.log('vsize:', Config.vWidth, ', ', Config.vHeight);

        GameUi.init(app);

        // Utils.loadAllTextures(() => {
        //     //添加切换前后台监听
        //     // this.addWxListener();

        //     // this.initPlayer();

        //     let gameMgr = new GameMgr(this);
        //     gameMgr.showMainLayer();
        //     this.gameMgr = gameMgr;

        //     // this.gotoMainLayer();

        //     // window.MainLayer && window.MainLayer.showFirstAnimation();
        // });

        let layer = GameUi.showLoadingLayer();
        layer.load(() => {
            GameUi.removeLayer('Loading');
            let gameMgr = new GameMgr(this);
            gameMgr.showMainLayer();
            this.gameMgr = gameMgr;
        })
    

        this.app = app;
    }

    // pause() {
    //     //正在运行, 或者正在倒计时, 清除倒计时, 暂停
    //     // if (DataBus.gameStatus == DataBus.GameStatus.Running ||
    //     //     (window.GameLayer && window.GameLayer.clearCountDown())) {
    //     //     this.enableControl(false);
    //     //     this.paused = true;
    //     //     DataBus.gameStatus = DataBus.GameStatus.Pause;
    //     // }
    // }
    // resume() {
    //     //从暂停模式恢复
    //     // if (DataBus.gameStatus == DataBus.GameStatus.Pause) {
    //     //     //正在显示新手指引, 直接开始
    //     //     if(this._guideUiDisplayed){
    //     //         this.enableControl(true);
    //     //         this.paused = false;
    //     //         DataBus.gameStatus = DataBus.GameStatus.Running;
    //     //     }
    //     //     //普通状态, 倒计时后开始
    //     //     else{
    //     //         console.log('后台返回调用readygo');
    //     //         this.readyGo();
    //     //     }
    //     // }
    // }



    // /**
    //  * 打开2D游戏界面, 开始游戏
    //  */
    // startGame() {
    //     //显示2D游戏界面
    //     window.GameUi && window.GameUi.showGameLayer();

    //     SDK.hideBanner();

    //     console.log('开始游戏调用readygo');
    //     this.readyGo();
    // }

    // /**
    //  * 重置3D起始场景, 打开2D游戏界面, 开始游戏
    //  */
    // restartGame() {
    //     //3D
    //     this.reset3DStage();

    //     //重置数据
    //     this.resetData();

    //     //开始游戏
    //     this.startGame();
    // }

    // readyGo() {

    //     this.enableControl(true);
    //     this.paused = false;
    //     DataBus.gameStatus = DataBus.GameStatus.Running;

    // }

    // preFail() {
    //     window.GameUi && window.GameUi.showReviveLayer();

    //     DataBus.gameStatus = DataBus.GameStatus.Revive;

    //     //停止移动和触摸
    //     this.enableControl(false);
    //     this.paused = true;
    // }

    // revive() {
    //     //显示2D游戏界面 //在复活界面处理游戏界面的显示
    //     // window.GameUi && window.GameUi.showGameLayer();

    //     DataBus.gameStatus = DataBus.GameStatus.Running;
    //     //复活次数增加
    //     DataBus.reviveTimes += 1;

    //     //复活总记录
    //     DataBus.record.revive += 1;

    //     //设置无敌
    //     // this._hero.setInvincible(500 + 2000);

    //     //重置速度
    //     if (Config.isReviveResetVelocity) {
    //         this._gear = 1;
    //     }

    //     console.log('复活调用readygo');
    //     this.readyGo();
    // }

    // fail() {
    //     DataBus.gameStatus = DataBus.GameStatus.Result;

    //     //停止移动和触摸
    //     this.enableControl(false);
    //     this.paused = true;

    //     //更新分数记录
    //     DataBus.updateScore();
    //     //更新金币
    //     DataBus.updateGold();
    //     //保存到本地
    //     (DataBus.newRecord || (DataBus.goldInc > 0)) && DataBus.saveLocalData();
    //     //提交到服务器
    //     DataBus.submitScore();

    //     //更新游戏记录
    //     this.updateRecord();

    //     //移除游戏界面
    //     window.GameLayer && window.GameLayer.destroy({
    //         children: true
    //     });
    //     //显示结果界面
    //     window.GameUi && window.GameUi.showResultLayer();
    // }

    // updateRecord() {
    //     let ts = new Date().getTime();
    //     let timeInc = ts - (this._recordUpdateTime || 0);
    //     this._recordUpdateTime = ts;

    //     //游戏次数记录
    //     //如果时间间隔太短, 就不算有效的一次游戏
    //     if (timeInc > 8 * 1000) {
    //         DataBus.record.play += 1;
    //     }

    //     //金币记录
    //     DataBus.record.gold = Math.max(DataBus.record.gold, DataBus.gold);

    //     //高分次数记录
    //     if (DataBus.score >= 1000) {
    //         DataBus.record.score1000 += 1;
    //     }
    //     if (DataBus.score >= 500) {
    //         DataBus.record.score500 += 1;
    //     }
    //     if (DataBus.score >= 100) {
    //         DataBus.record.score100 += 1;
    //     }
    //     if (DataBus.score >= 50) {
    //         DataBus.record.score50 += 1;
    //     }

    //     DataBus.saveRecordData();
    // }

    // enableControl(enable) {
    //     // if (enable) {
    //     //     canvas.addEventListener('touchstart', onTouchStart, false);
    //     //     canvas.addEventListener('touchmove', onTouchMove, false);
    //     // } else {
    //     //     canvas.removeEventListener('touchstart', onTouchStart, false);
    //     //     canvas.removeEventListener('touchmove', onTouchMove, false);
    //     // }


    // }


    // vibrateShort() {
    //     DataBus.vibrateEnabled &&
    //         window.wx && typeof wx.vibrateShort == 'function' && wx.vibrateShort();
    // }
    // vibrateLong() {
    //     DataBus.vibrateEnabled &&
    //         window.wx && typeof wx.vibrateLong == 'function' && wx.vibrateLong();
    // }

    // cameraShake() {
    //     this._shakeTween && TWEEN.remove(this._shakeTween);
    //     let v = v3Temp4.copy(this.camera.position);
    //     this._shakeTween = new TWEEN.Tween(this.camera.position).to({
    //         x: [v.x + .05, v.x - .05, v.x + .05, v.x - .05, v.x + .05, v.x - .05, v.x],
    //         y: [v.y + .08, v.y - .06, v.y + .08, v.y - .06, v.y, v.y + .05, v.y + .08, v.y],
    //         z: [v.z - .06, v.z + .07, v.z - .06, v.z + .07, v.z - .01, v.z, v.z + .03, v.z - .06, v.z],
    //     }, 0.45).start();
    // }

    setSpeed(s) {
        this._speed = s;
    }
    getSpeed() {
        return this._speed;
    }

    switchToScene(sceneType) {
        this._sceneType = sceneType;
    }

    update(dt) {
        this.controls && this.controls.update();

        this.gameMgr && this.gameMgr.update(dt);
    }

    pause() {
        this._animId && cancelAnimationFrame(this._animId)
        this._animId = null
        console.log('主域暂停')
    }

    resume() {
        console.log('主域恢复')
        this._animId && cancelAnimationFrame(this._animId)
        this._animId = requestAnimationFrame(this.renderBind)

    }

    render(t) {
        this._animId = requestAnimationFrame(this.renderBind);

        t = t || 0;
        this._last = this._last || 0;
        let dt = t - this._last;
        dt > 50 && (dt = 50);
        dt *= 0.001;
        this._last = t;

        // if(this._frameIndex > 250 && this._frameIndex < 270) {
        //     console.log(`t:${t}, dt:${dt}`);
        // }

        //动画
        this._frameTime += dt * this._speed;
        TWEEN.update();
        window.GROUP_VAR.update(this._frameTime);

        //更新
        this.update(dt);

        //3D渲染
        let e = this.gl;
        let r = this.renderer.state;
        this.renderer.clear(true, true, false);
        e.blendFunc(e.ONE, e.ZERO);
        r.setFlipSided(false);
        r.enable(e.DEPTH_TEST);
        r.setCullFace(THREE.CullFaceBack);
        r.setBlending(THREE.NoBlending);
        if(this._sceneType == Main.SceneType.Shop) {
            this.renderer.render(this.bgScene, this.bgCamera);
            this.renderer.render(this.shopScene, this.shopCamera);
        } else {
            this.renderer.render(this.bgScene, this.bgCamera);
            this.renderer.render(this.scene, this.camera);
        }
        r.reset();

        //2D渲染
        e.disable(e.CULL_FACE);
        e.disable(e.DEPTH_TEST);
        e.enable(e.BLEND);
        e.blendFunc(e.ONE, e.ONE_MINUS_SRC_ALPHA);
        // e.blendEquationSeparate(e.FUNC_ADD, e.FUNC_ADD);
        // e.blendFuncSeparate(e.SRC_ALPHA, e.ONE_MINUS_SRC_ALPHA, e.ONE, e.ONE_MINUS_SRC_ALPHA);
        e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL, false);
        this.app.renderer.state.setDepthTest(false);
        this.app.renderer.state.setCullFace(false);
        this.app.ticker.update(t);
        this.app.render();
        this.app.renderer.reset();

        ++this._frameIndex;
    }
}

Main.SceneType = {
    Normal: 0,
    Shop: 1,
}
import * as PIXI from '../libs/pixi'
import * as THREE from '../libs/three'
import TWEEN from '../libs/tween.js'

import Config from '../base/Config'
import Utils from '../base/Utils'

import Character from '../obj/Character'
import Platform from '../obj/Platform'

import TouchMgr from '../mgr/TouchMgr'
import CameraMgr from '../mgr/CameraMgr'
import SceneMgr from '../mgr/SceneMgr'
import SoundMgr from '../mgr/SoundMgr'
import LevelMgr from '../mgr/LevelMgr'
import ShopSceneMgr from '../mgr/ShopSceneMgr';

import DataBus from '../runtime/DataBus'

import GameUi from '../ui/GameUi'
import SubMgr from '../ui/SubMgr'
import RankLayer from '../ui/RankLayer'
import Helper from '../ui/Helper';

import SDK from '../libs/sdk'

import {
    Pool
} from '../base/Pool'
import EE from '../base/EE';

let v3Temp1 = new THREE.Vector3();
let v3Temp2 = new THREE.Vector3();
let v3Temp3 = new THREE.Vector3();

//游戏管理, 管理游戏流程
export default class GameMgr {
    constructor(obj) {

        this._sceneMgr = new SceneMgr(obj.scene);
        this._cameraMgr = new CameraMgr(obj.camera, obj.light);
        this._touchMgr = null;
        this._soundMgr = SoundMgr.instance;

        this._cur = null; //当前底座
        this._next = null; //下一底座
        this._bridge = null; //当前桥
        this._hero = null; //英雄
        this._ruler = null; //尺子
        this._bridgeTip = null; //桥的提示线框
        this._tempPet = null; //临时宠物
        this._petList = []; //获得的宠物列表

        this._nextDir = 'z'; //当前方向
        this._touchMode = GameMgr.TouchMode.NONE; //当前游戏的触摸模式
        this._curTouch = GameMgr.TouchMode.NONE; //用于标识此次触摸是什么模式下开始的

        this._curLvl = -1; //当前关卡序号
        this._curSubIndex = -1; //当前关卡的音符序号
        this._index = 0; //此次游戏音符序号

        this._nextLevelObj = null; //下一关相关值

        // this._bridgeSoundIndex = 0; //桥增长声音序号

        this._v3Pool = new Pool(); //坐标池

        this.initPosPool();
        this.initTouch();

        GameUi.showAd();

        this.addWxListener();

        GameMgr.instance = this;

        // let len = LevelMgr.getLevelsLength();
        // let arr = [];
        // for(let i = 0; i < len; ++i) {
        //     let obj = LevelMgr.getLevelData(i);
        //     let l = SoundMgr.instance.getMusicTonesLength(obj.name);
        //     arr.push({
        //         name: obj.title,
        //         len: l,
        //     });
        // }
        // console.log('乐曲长度: ', arr);
    }

    //初始化坐标池
    initPosPool() {
        this._v3Pool.createFunc = () => new THREE.Vector3();
        for (let i = 0; i < 10; ++i) {
            this._v3Pool.put(new THREE.Vector3());
        }
    }

    //清空场景, 主要物体移除到池
    clearScene() {
        this._sceneMgr.clear();
        this._cur = null;
        this._next = null;
        this._bridge = null;
        this._hero = null;
        this._ruler = null;
        this._bridgeTip = null;
        this._tempPet = null;
        this._petList.length = 0;
    }

    //初始场景, 创建一个底座, 一个主角, 镜头对齐
    initScene() {

        //分数清0
        DataBus.score = 0;
        DataBus.combo = 0;
        DataBus.reviveTimes = 0;
        DataBus.rulerTimes = 0;

        //关卡清0
        this._curLvl = -1;
        this._curSubIndex = -1;
        this._index = 0;

        // this._bridgeSoundIndex = 0

        //还原背景
        this._sceneMgr.setBg(LevelMgr.getLevelData(0).bg, 3);

        //清空3D物体
        this.clearScene();

        //创建新的3D物体
        this._nextDir = 'z';
        let param = LevelMgr.getPlatformParam(this._curLvl, this._curSubIndex);
        let model = Utils.model(LevelMgr.getPlatformModel());
        this._cur = this._sceneMgr.createPlatform(model, null, null, param.size, param.dis);
        this._cur.target = null;
        this._cur.dontLoadTarget = true;

        this._hero = this._sceneMgr.createHero();
        this._hero.visible = true;
        this._hero.position.set(0, 0, 0);
        //this._hero.dir = this._nextDir;
        this._hero.rotation.y = -Math.PI * 0.75;

        this._cameraMgr.lookAt(v3Temp2.set(-8, 0, -8));
        for (let i = 0, len = DataBus.petList.length; i < len; ++i) {
            let lvl = DataBus.petList[i];
            let key = LevelMgr.getPetData(lvl).pet;
            let pet = this._sceneMgr.createPet(Utils.model(key));
            pet.visible = false;
            pet.position.set(0, 0, 0);
            this._petList.push(pet);
        }
    }

    showMainLayer() {
        this.initScene();

        //关闭游戏2D层
        GameUi.removeLayer('Game');

        //显示首页2D层
        let layer = GameUi.showMainLayer();
        layer.onBtnStartClick = () => {
            LevelMgr.setLevelMode(LevelMgr.LevelMode.Level);
            this.startGame();
        };
        layer.onBattle = index => {
            this.startBattle(index);
        }
    }

    // 开始游戏
    startGame() {
        let layer = GameUi.showGameLayer();

        this._hero.turnToDir(this._nextDir, Config.heroTurnDuration);

        this._nextLevelObj = LevelMgr.getNextLevelIndex(this._curLvl, this._curSubIndex);
        this.nextStep();

        layer.showTutorial();
    }

    // 挑战某关
    startBattle(index) {

        LevelMgr.setLevelMode(LevelMgr.LevelMode.Battle);

        index = Math.min(LevelMgr.getLevelsLength() - 1, Math.max(0, index || 0));

        this.initScene();

        this._curLvl = index - 1;
        this._curSubIndex = -1;

        this.startGame();
    }

    //准备下一步
    prepareForNext() {

        this._cur = this._next;
        this._next = null;
        this._nextDir = this._cur.dir == 'x' ? 'z' : 'x';
        this._hero.turnToDir(this._nextDir, Config.heroTurnDuration, () => {
            this.nextStep();
        });
    }

    // 下一步, 创建下一个底座, 移动镜头, 启用触摸
    nextStep() {

        let len = LevelMgr.getLevelsLength();

        //完成一个底座, 准备更新为下一个底座
        let obj = this._nextLevelObj;

        //过关处理
        if (obj.levelUp) {
            //获得宠物
            this.gotPet();

            //保存记录
            this.saveLevelRecord();

            //其它完成关卡提示

            //挑战模式, 过关时, 切换至普通模式第一关
            if (LevelMgr._levelMode == LevelMgr.LevelMode.Battle) {
                obj.lvl = 0;
                obj.index = 0;
                LevelMgr.setLevelMode(LevelMgr.LevelMode.Level);
            }

            //切换背景
            let l = LevelMgr.getLevelData(obj.lvl);
            this._sceneMgr.setBg(l.bg, 3);
        }

        //切换下一底座索引
        this._curLvl = obj.lvl;
        this._curSubIndex = obj.index;
        this._index = this._index + 1;
        console.log('底座序号: ', this._index);

        //创建下一个底座
        let param = LevelMgr.getPlatformParam(this._curLvl, this._curSubIndex);
        let model = Utils.model(LevelMgr.getPlatformModel());
        console.log('platform param: ', param);
        this._next = this._sceneMgr.createPlatform(model, this._cur, this._nextDir, param.size, param.dis);

        //移动镜头
        this._cameraMgr.lookAt(
            this._cur,
            this._next,
            this._cur.size * 0.707 + 2,
            this._next.size * 0.707 + 2,
            true,
            () => {
                if (obj.levelUp) {
                    let pos = this._cameraMgr.getScreenCoord(this._cur.position, v3Temp1);
                    // console.log(`坐标: ${pos.x}, ${pos.y}`);
                    pos.y -= 160;

                    if (obj.hasPet && !obj.gotPet) {
                        GameUi.GameLayer && GameUi.GameLayer.showPetDialog(obj.petIndex);
                    }
                }

                //显示下一个宠物提示
                let nextDistance = LevelMgr.getNextPetDistance(this._curLvl, this._curSubIndex);
                if (nextDistance > 0) {
                    GameUi.GameLayer && GameUi.GameLayer.showNextPetTips(nextDistance);
                } else {
                    GameUi.GameLayer && GameUi.GameLayer.closeNextPetTips();
                }
            }
        );

        //底座上移动画
        let bounce = true;
        this._next.moveUp(bounce, () => {

            //闪烁道具按钮
            let nextParam = LevelMgr.getPlatformParam(this._curLvl, this._curSubIndex + 1);
            if(nextParam && nextParam.far) {
                GameUi.GameLayer && GameUi.GameLayer.runRulerBtnAction();
            }

            //当前关卡终点, 如果此关未通关过, 则创建宠物
            let obj = LevelMgr.getNextLevelIndex(this._curLvl, this._curSubIndex);
            this._nextLevelObj = obj;
            if (obj.hasPet && !obj.gotPet) {
                let lvl = LevelMgr.calcPetIndex(this._curLvl);
                obj.petIndex = lvl;
                this.addPetToPlatform(this._next, lvl);
            }

            this._sceneMgr.hidePlatformOutRange(this._next);

            this.prepareForBridge();
        });
    }

    saveLevelRecord() {
        let obj = this._nextLevelObj;
        if (obj.hasPet && !obj.gotPet) {
            //保存得到宠物记录
            DataBus.petList.push(obj.petIndex);
            //已有宠物去重
            let set = new Set(DataBus.petList);
            DataBus.petList = [...set];
            //收到的赠送宠物删除
            let index = DataBus.giftList.indexOf(obj.petIndex);
            if (index > -1) {
                DataBus.giftList.splice(index, 1);
            }
        }
        //保存过关数及底座数
        if (LevelMgr._levelMode == LevelMgr.LevelMode.Level) {
            this._curLvl > DataBus.levelRecord && (DataBus.levelRecord = this._curLvl);
            this._index > DataBus.platformRecord && (DataBus.platformRecord = this._index);
        }
        DataBus.saveAllData();
    }

    prepareForBridge() {
        //创建桥
        this._bridge = this._sceneMgr.createBridge(this._cur, this._next);
        this._bridge.visible = false;

        //创建尺子
        this.useRuler();

        //创建桥的线框提示
        this._sceneMgr.removeBridgeTip();
        if (this._index <= Config.bridgeTipsTimes) {
            let len = this._getBestDistance(this._cur, this._next);
            this._bridgeTip = this._sceneMgr.createBridgeTip(this._bridge.dir, this._bridge._originPos, len);
        }

        // 测试功能 如果还在加速, 则增长桥
        if (Config.pressToGrowBridge && this._curTouch == GameMgr.TouchMode.SPEED_UP) {
            this._curTouch = GameMgr.TouchMode.BRIDGE;
            this.onTouchStartForBridge();
        }

        //启用桥触摸
        this.enableBridgeTouch();
    }

    //尝试使用过关神器
    useRuler() {
        this._sceneMgr.removeRuler();
        if (DataBus.rulerTimes > 0) {
            DataBus.rulerTimes = DataBus.rulerTimes - 1;
            Helper.showToast(`过关神器已部署, 还剩${DataBus.rulerTimes}次!`, 1);
            this._ruler = this._sceneMgr.createRuler(this._cur, this._next);
            this._ruler.visible = false;
        } else {
            GameUi.GameLayer.updateRulerBtn();
        }
    }

    // 启用增长桥的触摸
    enableBridgeTouch() {
        this._touchMgr.setTouchEnable(true);
        this._touchMode = GameMgr.TouchMode.BRIDGE;
    }

    // 启用触摸加速
    enableSpeedUpTouch() {
        this._touchMgr.setTouchEnable(true);
        this._touchMode = GameMgr.TouchMode.SPEED_UP;
    }

    // 关闭触摸
    disableTouch() {
        this._touchMgr.setTouchEnable(false);
        this._touchMode = GameMgr.TouchMode.NONE;
    }

    // 初始触摸
    initTouch() {
        this._touchMgr = new TouchMgr(GameUi._pnlUi, e => {
            // console.log('touch start: ', e);
            this._curTouch = this._touchMode;

            if (this._touchMode == GameMgr.TouchMode.BRIDGE) {

                this.onTouchStartForBridge();

            } else if (this._touchMode == GameMgr.TouchMode.SPEED_UP) {
                this.speedUp();
            }
        }, e => {
            // console.log('touch ended: ', e);

            this.stopSpeedUp();

            if (this._curTouch != this._touchMode) {
                //模式已切换, 那么这次触摸是无效的

            } else if (this._touchMode == GameMgr.TouchMode.BRIDGE) {

                this.onTouchEndForBridge();

            } else if (this._touchMode == GameMgr.TouchMode.SPEED_UP) {

            }
            this._curTouch = GameMgr.TouchMode.NONE;
        });
    }

    onTouchStartForBridge() {
        let layer = GameUi.GameLayer;
        if (layer) {
            layer.closePetDialog();
            layer.closeTutorial();
            // layer.stopRulerBtnAction();
        }
        SoundMgr.instance.stopAllMusic();
        this.stopSpeedUp();

        this.bridgeGrowUp();
    }

    onTouchEndForBridge() {
        this.disableTouch();
        this.enableSpeedUpTouch();

        window.GROUP_VAR.removeByTarget(this._bridge);
        let result = this.checkResult();
        this.bridgeFall(result);

        this._sceneMgr.removeRuler();
        this._ruler = null;

        this._sceneMgr.removeBridgeTip();
        this._bridgeTip = null;
    }

    bridgeGrowUp() {
        // new TWEEN.Tween(this._bridge).to({
        //     len: Config.bridgeMaxLen,
        // }, Config.bridgeMaxLen / Config.bridgeGrowSpeed).start();

        // let sound = '0' + (this._bridgeSoundIndex + 1) + '.mp3';
        let sound = 'grow.mp3';
        this._soundMgr.playEffect(sound);

        this._bridge.visible = true;
        this._ruler && (this._ruler.visible = true);
        window.GROUP_VAR.removeByTarget(this._bridge);
        new TWEEN.Tween(this._bridge, window.GROUP_VAR).to({
            len: Config.bridgeMaxLen,
        }, Config.bridgeMaxLen / Config.bridgeGrowSpeed).onUpdate(obj => {
            this._ruler && (this._ruler.len = obj.len);
        }).start();
    }

    updateScore(result) {
        if (result < 0 || result > 3) {
            return;
        }

        // if(result == 0) {
        //     this._bridgeSoundIndex = 0
        // } else if(result == 1) {
        //     this._bridgeSoundIndex -= 1;
        // } else if(result == 3) {
        //     this._bridgeSoundIndex += 1;
        // }
        // this._bridgeSoundIndex = Math.min(7, Math.max(0, this._bridgeSoundIndex));

        //连环
        if (result == 3) {
            ++DataBus.combo;
        } else {
            DataBus.combo = 0;
        }

        //分数
        // TODO: 需要修改为DataBus内保存的宠物数量
        // let petCount = this._sceneMgr.petList.length;
        let petCount = DataBus.petList.length;
        let comboScore = Math.max(0, Math.min(30, (DataBus.combo - 1) * 5))

        let scoreArr = [1, 2, 3, 5];
        let score = (scoreArr[result] + comboScore) * (1 + petCount);

        DataBus.score += score;
        GameUi.GameLayer && GameUi.GameLayer.updateScore(DataBus.score);

        //提示
        // let descArr = ['过关', '合格', '优秀', '完美'];
        // let str = descArr[result];
        // if (result == 3) {
        //     str += ` x${DataBus.combo}`;
        // }
        // str += `\n+${score}`;
        // str += `\n${this._curSubIndex + 1} / ${LevelMgr.getLevelData(this._curLvl).data.length}`;
        // GameUi.GameLayer && GameUi.GameLayer.showLabel(
        //     str,
        //     Config.vWidth * 0.5,
        //     Config.vHeight * 0.3,
        //     0xcc3333
        // );

        let str = '+' + score;
        GameUi.GameLayer && GameUi.GameLayer.showTips(result, str);
    }

    // 桥倒下
    bridgeFall(result) {
        let sound = 'grow.mp3';
        this._soundMgr.stopEffect(sound);

        if (result < 0) {
            //桥倒下动画播放前就停止加速
            this._curTouch = GameMgr.TouchMode.NONE; //用于防止复活时桥加速增长
            this.disableTouch();
            this.stopSpeedUp();
        }

        //提前播放音效
        if (result >= 0 && result <= 3) {
            //计算音效播放的时间
            let speed = window.main ? window.main.getSpeed() : 1; //桥落下是否加速
            let duration = Config.bridgeFallDuration / speed; //桥落下动画持续时间
            let delay = Math.max(0, duration - 0.2); //音效提前0.2秒播放
            //播放音效
            new TWEEN.Tween({}, window.GROUP_VAR).to({}, delay).onComplete(() => {
                this._soundMgr.playEffect('score' + result + '.mp3');
            }).start();
        }

        // let bounce = result != -1;
        let bounce = false;
        this._bridge.fallDown(bounce, () => {

            //胜利则移动主角
            if (result >= 0) {

                //播放音效
                // LevelMgr.playMusicTone(this._curLvl, this._curSubIndex);
                // this._soundMgr.playEffect('fall.mp3');
                //播放音效                
                // if(result >= 0 && result <= 3) {
                //     this._soundMgr.playEffect('score' + result + '.mp3');
                // }

                //振动
                Utils.vibrateShort();

                //显示粒子效果
                let pos = v3Temp1.copy(this._next.position);
                // pos.y = 5;
                this._sceneMgr.showParticle(pos);

                //更新分数
                this.updateScore(result);

                //移动主角
                this._hero.playAction('Walk');
                this._hero.moveTo(this._next.position, Config.heroMoveSpeed, () => {
                    this._hero.playAction('Wait');
                    this.prepareForNext();
                });

                //移动宠物
                this.petsWalk(Config.petMoveInterval);

            }
            //长度太短, 则桥掉落
            else if (result == -1) {

                this._bridge.drop(Config.bridgeDropDuration, () => {
                    this.tryToRevive();
                });

            }
            //长度太长
            else {

                this.tryToRevive();

            }
        })
    }

    // 检测成绩, 完美3/优秀2/及格1/通过0/太短失败-1/太长失败-2
    checkResult() {
        let best = this._getBestDistance(this._cur, this._next);
        let len = this._bridge.len;
        //失败
        if (len < best - this._next.size * 0.5) {
            return -1;
        } else if (len > best + this._next.size * 0.5) {
            return -2;
        }
        let offset = Math.abs(best - len);
        //完美
        if (offset < Config.targetWidth * 0.5) {
            return 3;
        }
        //优秀
        else if (offset < Config.targetWidth * 1.5) {
            return 2;
        }
        //合格
        else if (offset < Config.targetWidth * 2.5) {
            return 1;
        }
        //过关
        else {
            return 0;
        }
    }

    // 弹出复活2D界面, 同意则复活, 否则失败
    tryToRevive() {
        //停止加速
        this._curTouch = GameMgr.TouchMode.NONE; //用于取消加速时增长桥
        this.disableTouch();
        this.stopSpeedUp();

        //关闭可能打开的道具对话框
        GameUi.GameLayer && (GameUi.GameLayer.closeRulerDialog());

        if (DataBus.reviveTimes >= Utils.getMaxReviveTimes()) {
            this.fail();

        } else {

            //此处逻辑:
            //先获取【复活道具】的【分享/视频】状态
            //如果是视频, 就显示视频按钮, 点击直接看视频
            //如果不是视频, 就判断有无道具, 有道具点击直接用道具复活
            //如果没有道具, 但有分享, 就显示复活道具框
            //没有视频, 没有分享, 没有道具, 直接失败

            console.log('======复活道具判断分享/视频======');
            let status = Utils.isShareOrVideo(Utils.SharePos.ItemRevive);

            //当前无视频也无分享, 也没有道具, 直接失败
            if(status == Utils.ShareVideoRet.None && DataBus.reviveItem <= 0) {
                this.fail();
            } else {

                //隐藏游戏界面
                GameUi.GameLayer && (GameUi.GameLayer.visible = false);
                let layer = GameUi.showReviveLayer();

                //复活界面创建复活或视频按钮
                layer.createBtn(status);

                layer.onSuccess = () => {
                    //成功复活, 再显示游戏界面
                    let layer = GameUi.GameLayer;
                    if (layer) {
                        layer.visible = true;

                        //使用了分享或者视频, 需要重新刷新道具使用
                        layer.updateRulerBtn();
                    }
                    this.revive();
                }
                layer.onFail = () => {
                    this.fail();
                }
            }
        }

    }

    //复活, 删除桥, 重新创建, 开启触摸
    revive() {
        DataBus.reviveTimes += 1;
        this._bridge && this._sceneMgr.removeBridge(this._bridge);
        this.prepareForBridge();
    }

    //失败, 提交分数, 显示结算界面
    fail() {
        //提交分数
        DataBus.updateScore();
        DataBus.submitScore();

        //删除游戏界面
        GameUi.GameLayer && (GameUi.GameLayer.destroy({
            children: true
        }));
        //宠物跳/转身
        this._petList.forEach((pet, i) => {
            pet.playAction('Jump');
            pet.delayTodo(i * 0.15, () => {
                pet.turnToAngle(-135 / 180 * Math.PI, 0.3);
            })
        })
        //主角跳/转身
        this._hero.playAction('Jump');
        // this._sceneMgr.fallDown(0.3, 15, () => {
        this._hero.turnToAngle(-135 / 180 * Math.PI, 0.5, () => {

            //显示结果界面
            let layer = GameUi.showResultLayer();
            layer.onHome = () => {
                this.showMainLayer();
            }
            layer.onRestart = () => {
                GameUi.removeLayer('Game');
                this.initScene();
                this.startGame();
            }
        })

        //最后一个底座掉落//底座上宠物掉落//桥掉落
        this._next.fallDown(2, -50);
        this._tempPet && this._tempPet.fallDown(2, -50);
        !this._bridge.isDrop && this._bridge.drop(6, null, TWEEN.Easing.Quadratic.In);
    }

    // 获取两底座之间的最佳成绩距离(需要的桥的长度)
    _getBestDistance(platform1, platform2) {
        let offsetX = Math.abs(platform1.position.x - platform2.position.x);
        let offsetZ = Math.abs(platform1.position.z - platform2.position.z);
        let radius1 = platform1.size * 0.5;
        let radius2 = platform2.size * 0.5;
        let offset = Math.max(offsetX, offsetZ);
        return offset - radius1 + Config.bridgePosOffset;
    }

    //动画加速
    speedUp() {
        window.main && window.main.setSpeed(3);
    }

    //停止动画加速
    stopSpeedUp() {
        window.main && window.main.setSpeed(1);
    }

    //添加一个宠物到底座上
    addPetToPlatform(platform, lvl) {
        let key = LevelMgr.getPetData(lvl).pet;
        let pet = this._sceneMgr.createPet(Utils.model(key));
        pet.position.copy(platform.position);
        // pet.pIndex = this._sceneMgr.platformList.length - 2;
        pet.appear(Config.appearDuration);
        this._tempPet = pet;
    }

    //得到一个宠物
    gotPet() {
        if (!this._tempPet) {
            return;
        }
        let pet = this._tempPet;
        pet.visible = true;
        this._petList.push(pet);
        this._tempPet = null;

        this.stopPetsWalk();
        this.petsWalk(0);
    }

    petsWalk(interval = 0) {
        //生成宠物的行动目的坐标(格式为{ pIndex:底座索引, dis:从该底座往后偏移的距离 })
        let pList = this._sceneMgr.platformList;
        let pLen = pList.length;
        if (pLen < 2) {
            return;
        }
        let petsLen = this._petList.length;
        let petIndex = 0;
        let obj = {};
        let spacing = Config.petSpacing;
        let sum = 0;
        let pDis = 0;
        let arr = [];
        for (let i = pLen - 1; i > 0 && petIndex < petsLen; --i) {
            let p1 = pList[i];
            let p2 = pList[i - 1];
            pDis = p1.position.distanceTo(p2.position);
            while (petIndex < petsLen) {
                if (sum + spacing <= pDis) {
                    sum += spacing;
                    arr[petIndex] = {
                            pIndex: i,
                            dis: sum,
                        }
                        ++petIndex;
                } else {
                    sum -= pDis;
                    break;
                }
            }
        }

        //获得最小底座索引值
        let pIndexArr1 = arr.map(obj => obj.pIndex);
        let pIndexArr2 = this._petList.map(pet => pet.pIndex).filter(pIndex => pIndex != undefined);
        let pIndexArr = pIndexArr1.concat(pIndexArr2);
        let pIndexMin = pIndexArr.length == 0 ? 0 : Math.min.apply(null, pIndexArr);

        //移动
        let delay = 0;
        arr.forEach((obj, index) => {
            let pIndex = obj.pIndex;
            let dis = obj.dis;
            let pet = this._petList[index];
            let arr = [];

            //存入转弯数据
            pet.pIndex = pet.pIndex != undefined ? pet.pIndex : pIndexMin;
            for (let i = pet.pIndex; i < pIndex; ++i) {
                arr.push({
                    pIndex: i,
                    dis: 0,
                })
            }
            //存入终点数据
            arr.push(obj);

            //依次显示
            if (!pet.visible) {
                delay += Config.appearDuration;
            }
            delay += interval;

            //移动
            this.walkToPlatform(pet, arr, 0, delay);
        })
    }

    walkToPlatform(pet, arr, i, delay) {
        let len = arr.length;
        if (i < len) {
            let pIndex = arr[i].pIndex;
            let dis = arr[i].dis;
            let platform = this._sceneMgr.platformList[pIndex];
            // let dir = platform.dir == 'x' ? 'z' : 'x';
            let dir = platform.dir;
            let pos = this._v3Pool.get();
            pos.copy(platform.position);
            pos[dir] -= dis;

            //移动, 完成后执行arr内的下一次移动
            let walkFunc = () => {
                pet.pIndex = pIndex;
                pet.playAction('Walk');
                let duration = pet.moveTo(pos, Config.petMoveSpeed, () => {
                    pet.playAction('Wait');
                    this.walkToPlatform(pet, arr, i + 1, 0);
                });
                //提前转弯
                if (i + 1 < len) {
                    let pIndex1 = arr[i + 1].pIndex;
                    let platform1 = this._sceneMgr.platformList[pIndex1];
                    // if (pet.dir != platform1.dir) {
                    if (!pet.isDirCorrect(platform1.dir)) {
                        let delay1 = duration - Config.petTurnDuration * 0.5;
                        delay1 < 0 && (delay1 = 0);
                        pet.delayTodo(delay1, () => {
                            pet.turnToDir(platform1.dir, Config.petTurnDuration);
                        });
                    }
                }
            }
            //先转弯再移动
            let turnFunc = () => {
                // if (pet.dir != dir) {
                if (!pet.isDirCorrect(dir)) {
                    pet.turnToDir(dir, Config.petTurnDuration);
                } else {
                    // walkFunc();//先转弯再移动
                }
                walkFunc(); //转弯的同时移动
            }
            //先出现再移动
            let appearFunc = () => {
                if (!pet.visible) {
                    pet.appear(Config.appearDuration);
                } else {}
                turnFunc();
            }
            //先延时再出现
            if (delay > 0) {
                pet.delayTodo(delay, appearFunc);
            } else {
                appearFunc();
            }
        }
    }

    stopPetsWalk() {
        this._petList.forEach(pet => {
            pet.removeAllTweens();
        })
    }

    update(dt) {
        Character.update(dt);
        this._sceneMgr.update(dt);
    }


    //添加微信前后台切换监听, 于材质加载成功后调用, 避免材质问题导致UI显示报错
    addWxListener() {

        //添加返回前台监听
        SDK.onShow('main', (res) => {

            if (res.query) {
                let pos = res.query.position_id;

                //统计
                if (pos != undefined) {
                    let self = (res.query.uuid == DataBus.uuid) ? 1 : 0;
                    SDK.shareStat(res.query.position_id, res.query.share_id, self);
                }

                //分享不再回调, 无法在分享时统计次数, 放在点分享进来的地方
                if (res.query.sid && DataBus.uuid == res.query.uuid) {
                    DataBus.checkShareTimestamp();
                    if(DataBus.shareList.indexOf(res.query.sid) == -1) {
                        // DataBus.shareTimes = (parseInt(DataBus.shareTimes) || 0) + 1;
                        DataBus.shareList.push(res.query.sid);
                        DataBus.shareTimestamp = new Date().getTime();
                    }
                    DataBus.saveAllData();
                }

                //群排行
                if (pos == Utils.SharePos.Group) {
                    //复活界面不显示群排行榜
                    if (res.shareTicket && DataBus.gameStatus != DataBus.GameStatus.Revive) {
                        let param = new SubMgr.SubParam();
                        param.copy(SubMgr.getLastParam());
                        Helper.showRankLayer(RankLayer.RankType.Group, res.shareTicket, () => {
                            SubMgr.switchToParam(param);
                        });
                    }
                }
                //收到赠送的音乐
                else if (pos == Utils.SharePos.Music) {
                    let index = res.query.sound || 0;
                    let isPass = (DataBus.petList.indexOf(index) != -1);
                    let isReceived = (DataBus.giftList.indexOf(index) != -1);
                    let len = LevelMgr.getPetsLength();
                    if (!isPass && !isReceived && index >= 0 && index < len) {
                        DataBus.giftList.push(index);
                        DataBus.saveAllData();
                        if (GameUi.MainLayer) {
                            GameUi.MainLayer.showShop(index);
                        }
                        Helper.showToast('您收到了一个音乐精灵!');
                    } else {}
                }
                //是自已点击
                else if (DataBus.uuid == res.query.uuid) {
                    let timeOK = () => {
                        if (Utils.getInterval(res.query.t) >= Config.itemShareTimeout) {
                            Helper.showToast('这个道具分享已经超时啦!');
                            return false;
                        }
                        return true;
                    }
                    let notReceived = () => {
                        DataBus.clearReceiveList();
                        if (DataBus.receiveItemList.findIndex(o => o.sid == res.query.sid) > -1) {
                            Helper.showToast('这个道具已经领取过啦!');
                            return false;
                        }
                        return true;
                    }
                    //获得尺子道具
                    if (pos == Utils.SharePos.ItemRuler) {
                        if (timeOK() && notReceived()) {
                            Utils.checkShareTicket(res.shareTicket, () => {
                                let max = parseInt(SDK.ruler_max) || Config.maxItemCount;
                                let inc = parseInt(SDK.ruler_inc) || 1;
                                DataBus.receiveItemList.push({
                                    sid: res.query.sid,
                                    t: new Date().getTime()
                                });
                                DataBus.rulerItem = Math.min(max, DataBus.rulerItem + inc);
                                DataBus.saveAllData();
                                Helper.showToast(`恭喜你获得了${inc}个过关神器!`);
                                EE.emit('update_ruler_number');

                            }, res => {
                                if(typeof res == 'string') {
                                    Helper.showToast(res);
                                }
                            });
                        }
                    }
                    //复活道具
                    else if (pos == Utils.SharePos.ItemRevive) {
                        if (timeOK() && notReceived()) {
                            Utils.checkShareTicket(res.shareTicket, () => {
                                let max = parseInt(SDK.revive_item_max) || Config.maxItemCount;
                                let inc = parseInt(SDK.revive_item_inc) || 1;
                                DataBus.receiveItemList.push({
                                    sid: res.query.sid,
                                    t: new Date().getTime()
                                });
                                DataBus.reviveItem = Math.min(max, DataBus.reviveItem + inc);
                                DataBus.saveAllData();
                                Helper.showToast(`恭喜你获得了${inc}个复活币!`);
                                EE.emit('update_revive_item_number');
                            }, res => {
                                if(typeof res == 'string') {
                                    Helper.showToast(res);
                                }
                            });
                        }
                    }
                }
            }

            if(SDK.item_share_tip && (new Date().getTime() - DataBus.shareItemTimestamp < 60 * 1000)) {
                // Helper.showTips('分享后, 需要您[color=0xffe600]亲自[/color]去群里点开分享的链接, 才能得到道具哦~');
                Helper.showTips(SDK.item_share_tip);
            }
            DataBus.shareItemTimestamp = 0;

            window.main.resume();
        });

        //添加切换后台监听
        window.wx && wx.onHide && wx.onHide(() => {
            DataBus.saveAllData();
            window.main.pause();
        });

        //添加配置拉取回调
        SDK.onRemoteLoaded = (cfg) => {
            SDK.extend(SDK, cfg);
        }
    }

}

GameMgr.instance = null;

GameMgr.TouchMode = {
    NONE: 0,
    BRIDGE: 1,
    SPEED_UP: 2,
}
import * as PIXI from '../libs/pixi'
import TWEEN from '../libs/tween.js'
import SDK from '../libs/sdk'

import Config from '../base/Config'
import Utils from '../base/Utils'

import Helper from '../ui/Helper'
import Button from '../ui/Button'
import Progress from '../ui/Progress'
import FeedbackBtn from '../ui/FeedbackBtn';

import ObjLoader from '../obj/ObjLoader.js';

import SoundMgr from '../mgr/SoundMgr';
import LevelMgr from '../mgr/LevelMgr.js';

import DataBus from '../runtime/DataBus.js';
import wxDownloader from '../runtime/wx-downloader';



export default class LoadingLayer extends PIXI.Container {
    constructor() {
        super();

        this.w = Config.vWidth;
        this.h = Config.vHeight;

        this._selfTexPath = 'res/ui/loading/';

        FeedbackBtn.changeDepend(1);

        this.on('removed', () => {
            FeedbackBtn.changeDepend(-1);
            this._wxBtn && this._wxBtn.destroy();
            this._wxBtn = null;
        });
    }

    load(callback) {
        //先上报一次
        Utils.reportAppid(0);

        //加载
        this._load(callback);
    }

    _load(callback) {

        //开始加载
        this.loadSelfTexture().then(() => {
            //读取数据
            DataBus.readAllDataAsync().then(() => {
                //加载音效
                SoundMgr.instance.preloadAll().then(() => {
                    DataBus.saveAllData();
                });

                //检测本地缓存版本并清理
                return this.checkLocalAssets().then(() => {

                // return this.loadSubpackage().then(() => {
                    return this.loadAllTextures().then(() => {
                        // return this.needUnzipModel().then(need => {
                        // let need = false;
                        // let next = need ? this.unzipModel() : Promise.resolve();
                        // return next.then(() => {
                            return this.preloadModel().then(() => {
                                DataBus.saveAllData();

                                return this.auth().then(hasShowBtn => {
                                    if (hasShowBtn) {
                                        callback && callback();
                                    } else {
                                        return this.finishProgress(0.5).then(() => {
                                            callback && callback();
                                        });
                                    }
                                })

                            });
                        // });
                        // });
                    });
                // });
                })
            })
        }).catch(err => {
            console.log('加载发生问题: ', err);
            this.showReloadBtn(callback);
        });
    }

    loadSelfTexture() {
        return new Promise((resolve, reject) => {
            let arr = [
                'bg.jpg',
                'logo.png',
                'progress1.png',
                'progress2.png',
                'reload.png',
                'start.png',
            ];
            arr = arr.map(f => this._selfTexPath + f);
            PIXI.loader.add(arr).load(() => {
                this.createUi();
                resolve();
            });
        })
    }

    _res(name) {
        return PIXI.loader.resources[this._selfTexPath + name].texture;
    }

    createUi() {
        if (!this._uiLoaded) {

            //背景
            let bg = new PIXI.Sprite(this._res('bg.jpg'));
            bg.scale.set(this.w / bg.width, this.h / bg.height);
            this.addChild(bg);

            //标题
            let title = new PIXI.Sprite(this._res('logo.png'));
            title.anchor.set(.5, .5);
            title.x = this.w * .5;
            title.y = this.h * .3;
            this.addChild(title);

            //进度条
            let progressWidth = 600;
            let progress = new Progress(
                this._res('progress1.png'), this._res('progress2.png'), progressWidth
            );
            progress.pivot.set(progressWidth * 0.5, progress.height * 0.5);
            progress.x = this.w * .5;
            progress.y = this.h * .7;
            progress.setPercent(0);
            this.addChild(progress);
            this._progress = progress;

            //进度文本
            let lbl = Helper.createLabel('', 32, 0x76cfff);
            Helper.setLabelAlignCenter(lbl);
            lbl.x = this.w * .5;
            lbl.y = this.h * .7 - 40;
            this.addChild(lbl);
            this._lbl = lbl;

            this._uiLoaded = true;
        }

        //进度条动画
        this.beginProgress();
    }

    beginProgress() {
        TWEEN.removeByTarget(this._progress);
        this._progress.percent = 0;
        new TWEEN.Tween(this._progress).to({
            percent: 0.8
        }, 3).start();
    }

    setText(text) {
        this._lbl.text = text;
    }

    finishProgress(duration) {
        return new Promise((resolve, reject) => {
            this.setText('加载完成');
            TWEEN.removeByTarget(this._progress);
            new TWEEN.Tween(this._progress).to({
                percent: 1
            }, duration).onComplete(() => {
                resolve();
            }).start();
        });
    }

    checkLocalAssets() {
        if (DataBus.modelDownloadVersion != Config.modelVersion) {
            console.log('模型版本不一致, 需要清空本地缓存');
            this.setText('正在清理缓存...');
            return wxDownloader.cleanAllAssets();
        } else {
            return Promise.resolve();
        }
    }

    loadSubpackage() {
        this.setText('正在加载分包...');
        if (wx.loadSubpackage) {
            return new Promise((resolve, reject) => {
                wx.loadSubpackage({
                    name: 'audio',
                    success: function (res) {
                        console.log('分包加载成功');
                        resolve();
                    },
                    fail: function (res) {
                        console.log('分包加载失败');
                        resolve();
                    }
                });
            })
        } else {
            console.log('不支持分包, 手动触发加载');
            let subScript = 'res/audio/game.js';
            require(subScript);

            return Promise.resolve();
        }
    }

    getDynamicModelList(cache) {
        if (!this._dynamicModelList) {
            let length = LevelMgr.getLevelsLength();
            let set = new Set();
            for (let i = 0; i < length; ++i) {
                set.add(LevelMgr.getPetData(i).pet);
            }
            let arr = [...set];
            arr.push('hero');
            arr = arr.map(key => {
                return {
                    key: key,
                    file: Utils.model(key),
                    cache: cache,
                };
            });
            this._dynamicModelList = arr;
        }
        return this._dynamicModelList;
    }
    getStaticModelList(cache) {
        if (!this._staticModelList) {
            let arr = LevelMgr.getPlatformModelList();
            arr = arr.map(key => {
                return {
                    key: key,
                    file: Utils.model(key),
                    cache: cache,
                };
            });
            this._staticModelList = arr;
        }
        return this._staticModelList;
    }

    // needUnzipModel() {
    //     console.log('开始判断是否需要解压模型');
    //     if (DataBus.modelUnzipVersion != Config.modelVersion) {
    //         console.log('版本不一致, 需要解压模型');
    //         return Promise.resolve(true);
    //     }
    //     return new Promise((resolve, reject) => {
    //         let arr = [...this.getDynamicModelList(), ...this.getStaticModelList()];
    //         let length = arr.length;
    //         let fsm = wx.getFileSystemManager();
    //         let check = i => {
    //             if (i >= length) {
    //                 console.log('文件全部存在, 不需要解压模型');
    //                 resolve(false);
    //                 return;
    //             }
    //             let file = arr[i];
    //             fsm.access({
    //                 path: file,
    //                 success: res => {
    //                     check(i + 1);
    //                 },
    //                 fail: res => {
    //                     console.log(`文件${file}不存在, 需要解压模型`);
    //                     resolve(true);
    //                 },
    //             })
    //         }
    //         check(0);
    //     });

    // }

    // unzipModel() {
    //     console.log('开始解压模型');
    //     return new Promise((resolve, reject) => {
    //         this.setText('正在解压模型...');
    //         let zipFilePath = 'res/tex/model.zip';
    //         let targetPath = Utils.model('');
    //         let fsm = wx.getFileSystemManager();
    //         fsm.unzip({
    //             zipFilePath: zipFilePath,
    //             targetPath: targetPath,
    //             success: () => {
    //                 DataBus.modelUnzipVersion = Config.modelVersion;
    //                 DataBus.saveAllData();
    //                 resolve();
    //             },
    //             fail: reject,
    //         });
    //     });
    // }

    preloadModel() {
        console.log('开始预加载模型');
        this.setText('正在预加载模型...');

        let loadFunc = (arr) => {
            return arr.map(e => new Promise((resolve, reject) => {
                let file = e.file;
                let cache = e.cache;
                ObjLoader.instance.create(file, obj => {
                    console.log(`预加载模型${file}结果: ${!!obj}`);
                    obj && ObjLoader.instance.remove(obj);
                    resolve(!!obj);
                }, cache);
            }));
        }

        let arr1 = (this.getDynamicModelList(false));
        let arr2 = (this.getStaticModelList(true));
        
        //这是下载所有模型
        // let arr = [...arr1, ...arr2];

        //优先下载必要的模型, 其它的延后下载
        let arr = arr2; //用于优先下载
        arr2 = []; //用于延后下载
        let gotList = new Set(); //已获得的宠物KEY列表
        DataBus.petList.forEach(i => {
            gotList.add(LevelMgr.getPetData(i).pet);
        })
        arr1.forEach(o => {
            if(o.key == 'hero' || gotList.has(o.key)) {
                arr.push(o);
            } else {
                arr2.push(o);
            }
        })
        
        //每次只下5个模型
        arr = Utils.groupFor(arr, 5);

        let next = (arr, i) => {
            if(i < arr.length) {
                return Promise.all(loadFunc(arr[i])).then(() => {
                    return next(arr, i + 1);
                })
            } else {
                console.log('预加载模型结束');
                return Promise.resolve();
            }
        }

        return next(arr, 0).then(() => {
            console.log('开始加载其它模型(不占loading时间)');
            arr2 = Utils.groupFor(arr2, 5);
            next(arr2, 0);
        });

        // return next(arr, 0);        

        // return Promise.all([...arr1, ...arr2]);
    }

    loadAllTextures() {
        return new Promise((resolve, reject) => {
            this.setText('正在加载材质...');
            Utils.loadAllTextures(() => {
                resolve();
            })
        });
    }

    auth() {
        this.setText('正在下载配置...');
        console.log('等待配置拉取, 准备授权提交渠道')
        let waitingForCfg = new Promise((resolve, reject) => {
            //手动拉取主配置
            SDK.pullMainConfig(res => {
                console.log('拉取配置成功: ', res);
                resolve();
            }, res => {
                console.log('拉取配置失败: ', res);
                resolve();
            });
        })

        return waitingForCfg.then(() => {
            let authflag = (SDK.authflag == 1) ? 1 : 0;
            if (authflag == 1) {
                return this.finishProgress(0.5).then(() => {
                    return new Promise((resolve, reject) => {
                        this.showStartBtn(authSuccess => {
                            if (authSuccess) {
                                Utils.reportAppid(1);
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        })
                    })
                })
            } else {
                return Promise.resolve(false);
            }
        })
    }

    showStartBtn(callback) {
        this._progress.visible = false;

        this.setText('授权登录, 开始游戏');

        if (!this._btnStart) {
            let btn = Helper.createButton({
                tex: this._res('start.png'),
                x: this.w * .5,
                y: this.h * .75,
            })
            this.addChild(btn);
            this._btnStart = btn;
        }
        let btn = this._btnStart;
        btn.visible = true;

        this._wxBtn && this._wxBtn.destroy();
        let left = btn.x - btn.width * .5,
            right = btn.y - btn.height * .5,
            width = btn.width,
            height = btn.height;
        this._wxBtn = Helper.createUserInfoBtn(left, right, width, height, () => {
            callback && callback(true);
        }, () => {
            callback && callback(false);
        })
    }

    showReloadBtn(callback) {
        this._progress.visible = false;
        this._wxBtn && (this._wxBtn.destroy(), this._wxBtn = null);

        this.setText('加载失败, 请重试');

        if (!this._btnReload) {
            let btn = Helper.createButton({
                tex: this._res('reload.png'),
                x: this.w * .5,
                y: this.h * .75,
            });
            this.addChild(btn);
            this._btnReload = btn;
        }

        this._btnReload.visible = true;
        this._btnReload.onClick(() => {
            this._btnReload && (this._btnReload.visible = false);
            this._btnStart && (this._btnStart.visible = false);
            this.setText('开始重新加载...');
            setTimeout(() => {
                this._load(callback);
            }, 300);
        })
    }

}

LoadingLayer.globalName = 'LoadingLayer';
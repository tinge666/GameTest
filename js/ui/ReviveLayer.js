import * as PIXI from '../libs/pixi'
import SDK from '../libs/sdk'
import TWEEN from '../libs/tween.js'
import promisify from '../libs/Promisify.js'

import Config from '../base/Config'
import Utils from '../base/Utils'

import Helper from '../ui/Helper'
import Button from '../ui/Button'

import DataBus from '../runtime/DataBus'


class CircleProgress extends PIXI.Graphics {
    constructor(radius) {
        super();

        this._radius = radius;
        this._percent = 0;

        this.draw();
    }

    draw() {
        this.clear();

        this.lineStyle(6, 0xffffff, 1);
        this.beginFill(0xffffff, 0);
        // this.moveTo(0, 0);
        this.arc(0, 0, this._radius, -Math.PI * 0.5, -Math.PI * 0.5 + (this._percent) * Math.PI * 2, true);
        // this.closePath();
        this.endFill();
    }

    set percent(t) {
        this._percent = t;
        this.draw();
    }
    get percent() {
        return this._percent;
    }
}

export default class ReviveLayer extends PIXI.Container {
    constructor() {
        super();

        this.w = Config.vWidth;
        this.h = Config.vHeight;

        this._seconds = 8;
        this.hasVideo = SDK.hasVideo();

        this._tweenScale = null;
        this._tweenProgress = null;
        this._timerCountDown = null;

        this._lblCount = null;
        this._progress = null;
        this._root = null;

        this.onSuccess = null;
        this.onFail = null;

        // window.GameLayer && (window.GameLayer.visible = false);

        this.initUI();

        this.beginCountDown();
        this.beginActions();

        SDK.showBanner();

        this.on('removed', () => {
            this.stopAllActions();
        });
    }

    initUI() {
        //遮罩
        let mask = Helper.createMask(0.3);
        this.addChild(mask);

        //容器, 用于将所有元素置于720*1280空间内
        let root = new PIXI.Container();
        root.x = 0;
        root.y = (this.h - 1280) / 2;
        this.addChild(root);
        this._root = root;

        let centerX = this.w / 2;

        let circleX = centerX;
        let circleY = 420;

        //圆
        // let circle = new PIXI.Sprite(Utils.texRevive('circle.png'));
        // circle.anchor.set(.5, .5);
        // circle.x = circleX;
        // circle.y = circleY;
        // root.addChild(circle);
        // this._circle = circle;

        //圆环
        let ring = new CircleProgress(120);
        ring.x = circleX;
        ring.y = circleY;
        root.addChild(ring);
        // circle.mask = ring;
        // ring.isMask = true;
        this._progress = ring;

        //提示
        let str = this._seconds + '';
        let lbl = Helper.createLabel(str, 100, 0xffffff);
        Helper.setLabelAlignCenter(lbl);
        lbl.x = circleX;
        lbl.y = circleY;
        root.addChild(lbl);
        this._lblCount = lbl;

        //标题
        let title = Helper.createLabel('救我!', 120, 0xffffff);
        Helper.setLabelAlignCenter(title);
        title.x = centerX;
        title.y = 180;
        root.addChild(title);

        //提示2
        // if (Config.isReviveResetVelocity) {
        //     let lbl = Helper.createLabel('提示: 复活后速度会重置哦!', 32, 0xdddddd);
        //     Helper.setLabelAlignCenter(lbl);
        //     lbl.x = centerX;
        //     lbl.y = 590;
        //     root.addChild(lbl);
        // }
        
    }

    createBtn(status) {
        let root = this._root;
        let centerX = this.w / 2;

        //按钮数组
        let btnArr = [];

        //创建复活按钮
        {
            let pnl = new PIXI.Container();
            root.addChild(pnl);

            let tex = null;
            if(status == Utils.ShareVideoRet.Video) {
                tex = Utils.texRevive('btn_revive.png'); //视频复活
            } else {
                tex = Utils.texRevive('btn_revive_item.png'); //道具复活
            }

            let btn = Helper.createButton({
                tex: tex,
            });

            let tween = new TWEEN.Tween(btn).to({
                x: [5, -5, 5, -5, 5, -5, 5, -5, 0],
                y: [-5, 5, -5, 5, -5, 5, -5, 5, 0],
            }, 0.6).delay(0.6).repeat(Infinity).start();
            btn.on('removed', () => {
                TWEEN.remove(tween);
                tween = null;
            });

            btn.onClick(() => {
                //看视频
                if(status == Utils.ShareVideoRet.Video) {
                    this.stopAllActions();
                    Utils.shareOrVideo(status, Utils.SharePos.ItemRevive, res => {
                        this.success();
                    }, err => {
                        if(typeof err == 'string') {
                            Helper.showToast(err);
                        }
                        this.beginCountDown();
                        this.beginActions();
                    })
                }
                //使用复活道具
                else if (DataBus.reviveItem > 0) {
                    DataBus.reviveItem = DataBus.reviveItem - 1;
                    DataBus.saveAllData();
                    EE.emit('update_revive_item_number');
                    this.success();
                }
                //显示复活道具弹窗
                else {
                    this.stopAllActions();
                    tween && tween.stop();
                    Helper.showReviveItemDialog(status, () => {
                        this.success();
                    }, () => {
                        tween && tween.start();
                        this.beginCountDown();
                        this.beginActions();
                    })
                }
            })
            pnl.addChild(btn);

            // let tex = (status == Utils.ShareVideoRet.Share) ? 
            //     Utils.texRevive('btn_free_revive.png') :
            //     Utils.texRevive('btn_revive.png');
            // let btn = Helper.createButton({
            //     tex: tex,
            // });
            // btn.onClick(() => {
            //     this.stopAllActions();
            //     Utils.shareOrVideo(status, Utils.SharePos.Revive, res => {
            //         this.success();
            //     }, err => {
            //         if(typeof err == 'string') {
            //             Helper.showToast(err);
            //         }
            //         this.beginCountDown();
            //         this.beginActions();
            //     })
            // })
            // pnl.addChild(btn);

            btnArr.push(pnl);
        }

        //创建跳过按钮
        {
            let btn = Helper.createTextButton('跳过>', centerX, 900, () => {
                this.stopAllActions();
                this.fail();
            }, 40, 0xffffff);
            root.addChild(btn);

            btnArr.push(btn);
        }

        for (let i = 0, len = btnArr.length; i < len; ++i) {
            let btn = btnArr[len - i - 1];
            btn.position.set(centerX, 1000 - i * 150);
        }
    }

    //切记调用之前stopAllActions
    success() {
        console.log('复活成功')

        // window.GameLayer && (window.GameLayer.visible = true);
        // window.main && window.main.revive();

        this.onSuccess && this.onSuccess();

        this.destroy({
            children: true
        });
    }

    //切记调用之前stopAllActions
    fail() {
        console.log('复活失败')

        // window.main && window.main.fail();
        this.onFail && this.onFail();

        this.destroy({
            children: true
        });
    }


    beginCountDown() {
        //倒计时文字改变动画
        // if (!this.hasVideo)
        {
            this._timerCountDown = setInterval(() => {
                --this._seconds;
                if (this._seconds >= 0) {
                    this._lblCount && (this._lblCount.text = Math.floor(this._seconds));
                } else {
                    //到0停止
                    this.stopCountDown();
                }
            }, 1000);
        }
    }

    stopCountDown() {
        this._timerCountDown && clearInterval(this._timerCountDown);
        this._timerCountDown = null;
    }

    beginActions() {
        //文字呼吸动画
        this._lblCount.scale.set(1, 1);
        this._tweenScale = new TWEEN.Tween(this._lblCount.scale).to({
            x: 1.2,
            y: 1.2
        }, 0.25).repeat(Infinity).yoyo(true).start();
        //倒计时圆环进度条动画
        this._tweenProgress = new TWEEN.Tween(this._progress).to({
            percent: 1
        }, this._seconds + 0.5)
        // .onUpdate(() => {
        //     this._circle.mask = this._progress;
        // })
        .onComplete(() => {
            //进度条走完失败
            this.stopAllActions();
            this.fail();
        }).start();
    }

    stopActions() {
        this._tweenScale && TWEEN.remove(this._tweenScale);
        this._tweenProgress && TWEEN.remove(this._tweenProgress);
        this._tweenScale = null;
        this._tweenProgress = null;
    }

    stopAllActions() {
        this.stopActions();
        this.stopCountDown();
    }

}

ReviveLayer.globalName = 'ReviveLayer';
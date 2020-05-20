import * as PIXI from '../libs/pixi'
import TWEEN from '../libs/tween.js'
import SDK from '../libs/sdk'

import Config from '../base/Config'
import Utils from '../base/Utils'
import {
    Pool2D
} from '../base/Pool'

import Helper from '../ui/Helper'
import Button from '../ui/Button'

import DataBus from '../runtime/DataBus';

import LevelMgr from '../mgr/LevelMgr';
import SoundMgr from '../mgr/SoundMgr';
import EE from '../base/EE';

let poolLbl = new Pool2D();

export default class GameLayer extends PIXI.Container {
    constructor() {
        super();

        this.w = Config.vWidth;
        this.h = Config.vHeight;

        this._lblScore = null;

        this._petDialog = null;

        this.initUI();
    }

    initUI() {

        //加分分数背景
        {
            //容器
            let pnl = new PIXI.Container();
            pnl.x = this.w * .5;
            pnl.y = this.h * .25;
            pnl.visible = false;
            this.addChild(pnl);
            this._tipPnl = pnl;

            this._tipBgs = [];
            for(let i = 2; i >= 0; --i) {
                let tips = new PIXI.Sprite();
                tips.anchor.set(.5, .5);
                tips.visible = false;
                pnl.addChild(tips);
                this._tipBgs[i] = tips;
            }

            this._tipBgs[1].on('removed', () => {
                TWEEN.removeByTarget(this._tipBgs[1]);
            })
            this._tipBgs[2].on('removed', () => {
                TWEEN.removeByTarget(this._tipBgs[1]);
                TWEEN.removeByTarget(this._tipBgs[2]);
                TWEEN.removeByTarget(this._tipBgs[2].scale);
            })
        }

        //分数
        let lblScore = new PIXI.Text('0', {
            fontFamily: ['sans-serif-thin', 'sans-serif-light'],
            fontSize: 80,
            fill: 0xffffff,
        })
        lblScore.anchor.set(0, .5);
        lblScore.x = 50;
        lblScore.y = 150;
        this.addChild(lblScore);
        this._lblScore = lblScore;

        lblScore.on('removed', () => {
            this._lblScore.tween && TWEEN.remove(this._lblScore.tween);
            this._lblScore.tween = null;
        });

        //道具按钮
        let btnItem1 = Helper.createImageButton(Utils.texMain('btn_ruler.png'));
        this._rulerBtnPosX = this.w - btnItem1.width * 0.5 - 15;
        btnItem1.x = this._rulerBtnPosX;
        btnItem1.y = this.h * .16;
        btnItem1.visible = false;
        this.addChild(btnItem1);
        this._btnRuler = btnItem1;

        this._btnRuler.on('removed', () => {
            TWEEN.removeByTarget(this._btnRuler);
        })

        {
            // if (DataBus.captureRoadMode) {
            //     let mask = Helper.createMask(0, () => {
            //         this.destroy({
            //             children: true
            //         });
            //         window.main && window.main.fail();
            //     });
            //     this.addChild(mask);

            //     lblScore.visible = false;
            //     return;
            // }

            // //速度测试模式, 显示速度 和 暂停按钮
            // if (DataBus.speedTestMode) {
            //     let lbl = new PIXI.Text('', {
            //         fontFamily: ['sans-serif-thin', 'sans-serif-light'],
            //         fontSize: 30,
            //         fill: 0xffffff,
            //     })
            //     Helper.setLabelAlignCenter(lbl);
            //     lbl.x = this.w * 0.5;
            //     lbl.y = 300;
            //     this.addChild(lbl);

            //     let speedStr = '';
            //     this.setSpeedTestString = str => {
            //         (speedStr != str) && (lbl.text = str);
            //         speedStr = str;
            //     };

            //     let btn = Helper.createTextButton('暂停', this.w - 100, this.h - 50, null, 60);
            //     btn.tap = () => {
            //         window.main && (window.main.paused = !window.main.paused);
            //     };
            //     this.addChild(btn);
            // }

            // if(DataBus.invincibleMode) {
            //     let invincible = false;
            //     let btn = Helper.createTextButton('无敌', 100, this.h - 50, null, 60);
            //     btn.tap = () => {
            //         if(window.main) {
            //             if(invincible){
            //                 window.main._player.cancelInvincible();
            //                 btn.text = '无敌';
            //             }else{
            //                 window.main._player.setInvincible(10000000);
            //                 btn.text = '取消';
            //             }
            //         }
            //         invincible = !invincible;
            //     };
            //     this.addChild(btn);
            // }
        }
    }

    updateRulerBtn() {
        this._btnRuler.visible = false;
        if (DataBus.rulerTimes <= 0) {
            console.log('======尺子道具判断分享/视频======');
            let status = Utils.isShareOrVideo(Utils.SharePos.ItemRuler);
            if (status != Utils.ShareVideoRet.None) {
                console.log('显示过关神器按钮');
                this._btnRuler.onClick(() => {
                    // this.showRulerDialog(status);
                    this.stopRulerBtnAction();
                    this._rulerDialog = Helper.showRulerItemDialog(status, () => {
                        window.main.gameMgr.useRuler();
                        this._btnRuler.visible = false;
                    }, () => {
                        this._rulerDialog = null;
                    }, 0.5, this);
                })
                this._btnRuler.visible = true;
            }
        }
    }

    closeRulerDialog() {
        if(this._rulerDialog) {
            this._rulerDialog.destroy({children: true});
            this._rulerDialog = null;
        }
    }

    runRulerBtnAction() {
        if(this._btnRuler.visible) {
            this.stopRulerBtnAction();
            let arr = [-20, 0, -20, 0, -20, 0, -20, 0, 0, 0, 0, 0, 0, 0].map(x => x + this._rulerBtnPosX);
            new TWEEN.Tween(this._btnRuler).to({
                x: arr,
            }, 1.25).repeat(Infinity).start();
            
        }
    }
    stopRulerBtnAction() {
        TWEEN.removeByTarget(this._btnRuler);
        this._btnRuler.x = this._rulerBtnPosX - 0;
    }

    showRulerDialog(status) {

        SoundMgr.instance.playEffect('popout.mp3');

        //根节点
        let root = new PIXI.Container();
        this.addChild(root);

        let closeFunc = () => {
            root.destroy({
                children: true
            });
        }

        //遮罩
        let mask = Helper.createMask(0.5, closeFunc);
        root.addChild(mask);
        Helper.fadeTo(mask, 0, 1, 1);

        //容器
        let pnl = new PIXI.Container();
        pnl.x = this.w / 2;
        pnl.y = this.h / 2;
        root.addChild(pnl);
        Helper.scaleTo(pnl, 0.01, 1, 0.5, 0, TWEEN.Easing.Elastic.Out);

        //弹窗背景
        let w = 520,
            h = 671;
        let bg = new PIXI.mesh.NineSlicePlane(Utils.texDialog('box.png'), 10, 10, 10, 10);
        bg.interactive = true;
        bg.pivot.set(w * .5, h * .5)
        bg.width = w;
        bg.height = h;
        pnl.addChild(bg);

        //标题
        let title = new PIXI.Sprite(Utils.texDialog('title_ruler.png'));
        title.anchor.set(.5, 0);
        title.y = -h * .5 + 25;
        pnl.addChild(title);

        //关闭按钮
        let btnClose = Helper.createButton({
            tex: Utils.texDialog('btn_close.png'),
            x: w / 2 - 40,
            y: -h / 2 + 40,
            func: () => {
                closeFunc();
            },
        });
        pnl.addChild(btnClose);

        //图片
        let pic = new PIXI.Sprite(Utils.texDialog('ruler_sample.png'));
        pic.anchor.set(.5, 0);
        pic.y = -h * .5 + 105;
        pnl.addChild(pic);

        //按钮
        let tex = (status == Utils.ShareVideoRet.Share) ?
            Utils.texDialog('btn_ruler_free.png') :
            Utils.texDialog('btn_ruler_video.png');
        let btn = Helper.createButton({
            tex: tex,
            y: -h * .5 + 603,
            func: () => {
                Utils.shareOrVideo(status, Utils.SharePos.ItemRuler, res => {
                    DataBus.rulerTimes = parseInt(SDK.ruler_max_number) || 3;
                    window.main.gameMgr.useRuler();
                    this._btnRuler.visible = false;
                    closeFunc();
                }, err => {
                    if (typeof err == 'string') {
                        Helper.showToast(err);
                    }
                })
            }
        })
        pnl.addChild(btn);
    }

    showTutorial() {
        this._tutorial && this._tutorial.destroy({
            children: true
        });
        let pnl = new PIXI.Container();
        pnl.x = this.w * .5;
        pnl.y = this.h * 0.25;
        this.addChild(pnl);
        Helper.scaleTo(pnl, 0.8, 1, 0.2);
        this._tutorial = pnl;

        let sp1 = new PIXI.Sprite(Utils.texGame('tutorial1.png'));
        sp1.anchor.set(.5, .5);
        sp1.y = -35;
        pnl.addChild(sp1);

        let sp2 = new PIXI.Sprite(Utils.texGame('tutorial2.png'));
        sp2.anchor.set(.5, .5);
        sp2.y = 35;
        pnl.addChild(sp2);

    }
    closeTutorial() {
        this._tutorial && this._tutorial.destroy({
            children: true
        });
    }

    updateScore(score) {
        this._lblScore.tween && TWEEN.remove(this._lblScore.tween);
        this._lblScore.text = score;
        this._lblScore.scale.set(0, 0);
        this._lblScore.tween = new TWEEN.Tween(this._lblScore.scale).to({
            x: [1.2, 1],
            y: [1.2, 1]
        }, 0.2).start();
    }

    showTips(result, str) {
        let pnl = this._tipPnl;
        let bg0 = this._tipBgs[0];
        let bg1 = this._tipBgs[1];
        let bg2 = this._tipBgs[2];
        pnl.visible = true;
        bg0.visible = true;
        let color = 0xffffff;
        if (result == 3) {
            bg1.visible = true;
            bg2.visible = true;
            bg0.texture = Utils.texGame('tips3.png');
            bg1.texture = Utils.texGame('tips3_bg.png');
            bg2.texture = Utils.texGame('tips3_bg.png');
            bg1.anchor.set(.5, .5);
            bg1.y = 0;
            // bg2.scale.set(1.05, 1.05);
            // bg2.alpha = 0.6;
            color = 0xff6fa3;
        } else if (result == 2) {
            bg1.visible = true;
            bg2.visible = false;
            bg0.texture = Utils.texGame('tips2.png');
            bg1.texture = Utils.texGame('tips2_bg.png');
            bg1.anchor.set(.5, .5);
            bg1.y = 0;
            color = 0x8697fe;
        } else if (result == 1) {
            bg1.visible = true;
            bg2.visible = false;
            bg0.texture = Utils.texGame('tips1.png');
            bg1.texture = Utils.texGame('tips1_bg.png');
            bg1.anchor.set(.5, 0.45625);
            bg1.y = 9;
            color = 0xff64bd;
        } else {
            bg1.visible = false;
            bg2.visible = false;
            bg0.texture = Utils.texGame('tips0.png');
            color = 0x847eff;
        }
        TWEEN.removeByTarget(bg1);
        TWEEN.removeByTarget(bg2);
        TWEEN.removeByTarget(bg2.scale);
        if(bg1.visible) {
            bg1.rotation = 0;
            new TWEEN.Tween(bg1).to({
                rotation: Math.PI * 2,
            }, 2).repeat(Infinity).start();
        }
        if(bg2.visible) {
            // bg2.rotation = Math.PI * 2 / 6 / 2;
            // new TWEEN.Tween(bg2).to({
            //     rotation: bg2.rotation - Math.PI * 2,
            // }, 2).repeat(Infinity).start();
            bg2.scale.set(1, 1);
            bg2.alpha = 0.6;
            new TWEEN.Tween(bg2.scale).to({
                x: 2,
                y: 2,
            }, 0.5).start();
            new TWEEN.Tween(bg2).to({
                alpha: 0,
            }, 0.5).start();
        }
        pnl.alpha = 1;
        Helper.fadeTo(pnl, 1, 0, 0.3, 0.7, null, () => {
            TWEEN.removeByTarget(bg1);
            TWEEN.removeByTarget(bg2);
            TWEEN.removeByTarget(bg2.scale);
        });
        this.showLabel(str, pnl.x, pnl.y + 31, color);
    }

    //显示自动消失的文字, 主要用于提示分数增加
    showLabel(str, x, y, color, callback) {
        let lbl = poolLbl.get();
        lbl.text = str;
        lbl.style.fill = color;
        lbl.alpha = 1;
        lbl.x = x;
        lbl.y = y;
        lbl.scale.set(0, 0);
        this.addChild(lbl);

        let t1 = new TWEEN.Tween(lbl.scale).to({
            x: [1.2, 1],
            y: [1.2, 1],
        }, 0.2);

        let t2 = new TWEEN.Tween(lbl).to({
            alpha: [1, 0],
        }, 0.8).onComplete(() => {
            callback && callback();

            // lbl.destroy();
            poolLbl.put(lbl);

            t1 && TWEEN.remove(t1);
            t2 && TWEEN.remove(t2);
            t1 = null;
            t2 = null;
        });

        t1.chain(t2);
        t1.start();

        lbl.on('removed', () => {
            t1 && TWEEN.remove(t1);
            t2 && TWEEN.remove(t2);
            t1 = null;
            t2 = null;
        });

        return lbl;
    }

    //到下一个宠物的距离提示
    showNextPetTips(i) {
        if(!this._nextPetTips) {
            let w = 300;
            let h = 120;

            let ret = new PIXI.Container();
            ret.x = -w;
            ret.y = this.h * .25;
            this.addChild(ret);
            Helper.moveTo(ret, {
                x: -w,
                y: ret.y
            }, {
                x: 0,
                y: ret.y
            }, 0.3);

            let bg = new PIXI.mesh.NineSlicePlane(Utils.texGame('pet_box.png'), 4, 29, 31, 29);
            bg.width = w;
            bg.height = h;
            ret.addChild(bg);

            let lbl = Helper.createLabel('', 32, 0x686868);
            lbl.name = 'lbl';
            Helper.setLabelAlignCenter(lbl);
            lbl.x = w * .5;
            lbl.y = h * .5;
            ret.addChild(lbl);

            this._nextPetTips = ret;
        }

        let lbl = this._nextPetTips.getChildByName('lbl');
        if(lbl) {
            let txt = `距离解救下一个精灵\n还有${i}段路`;
            lbl.text = txt;
            Helper.setLabelAdaptSize(lbl, 250, 100);
        }

        return this._nextPetTips;
    }

    closeNextPetTips() {
        let dialog = this._nextPetTips;
        dialog && Helper.moveTo(dialog, {
            x: dialog.x,
            y: dialog.y
        }, {
            x: -300,
            y: dialog.y
        }, 0.3, 0, null, () => {
            dialog.destroy({
                children: true
            })
        });
        this._nextPetTips = null;
    }

    showPetDialog(petIndex) {
        this._petDialog && this._petDialog.destroy({
            children: true
        });
        let w = 300;
        let h = 200;

        let ret = new PIXI.Container();
        ret.x = -w;
        ret.y = this.h * .25;
        this.addChild(ret);
        Helper.moveTo(ret, {
            x: -w,
            y: ret.y
        }, {
            x: 0,
            y: ret.y
        }, 0.3);

        let bg = new PIXI.mesh.NineSlicePlane(Utils.texGame('pet_box.png'), 4, 29, 31, 29);
        bg.width = w;
        bg.height = h;
        ret.addChild(bg);

        let obj = LevelMgr.getPetData(petIndex);
        let txt = `成功解救${obj.petName}!`;

        let lbl = Helper.createLabel(txt, 32, 0x686868);
        lbl.x = 12;
        lbl.y = 30;
        Helper.setLabelAdaptSize(lbl, 210, 100);
        ret.addChild(lbl);

        let sp = new PIXI.Sprite(Utils.texPet(obj.pet));
        sp.anchor.set(.5, .5);
        sp.x = 280;
        sp.y = 23;
        ret.addChild(sp);

        let isPlaying = false;
        let btn1 = Helper.createButton({
            tex: Utils.texGame('btn_music.png'),
            x: 60,
            y: 134,
            func: () => {
                if (isPlaying) {
                    SoundMgr.instance.stopAllMusic();
                } else {
                    LevelMgr.playMusic(petIndex);
                }
                isPlaying = !isPlaying;
            }
        })
        ret.addChild(btn1);

        let btn2 = Helper.createButton({
            tex: Utils.texGame('btn_present.png'),
            x: 180,
            y: 134,
            func: () => {
                Utils.share(Utils.SharePos.Music, {
                    sound: petIndex,
                });
            }
        })
        ret.addChild(btn2);

        let btn3 = Helper.createButton({
            tex: Utils.texDialog('btn_close.png'),
            x: 260,
            y: 160,
            func: () => {
                this.closePetDialog();
            }
        })
        ret.addChild(btn3);


        this._petDialog = ret;
        return ret;
    }

    closePetDialog() {
        SoundMgr.instance.stopAllMusic();
        let dialog = this._petDialog;
        dialog && Helper.moveTo(dialog, {
            x: dialog.x,
            y: dialog.y
        }, {
            x: -300,
            y: dialog.y
        }, 0.3, 0, null, () => {
            dialog.destroy({
                children: true
            })
        });
        this._petDialog = null;
    }

    // _createHand(pos1, pos2) {
    //     let hand = new PIXI.Sprite(Utils.tex('hand.png'));
    //     hand.position.copy(pos1);

    //     let tween = new TWEEN.Tween(hand.position).to({
    //         x: pos2.x,
    //         y: pos2.y
    //     }, 1).repeat(Infinity).yoyo(true).start();

    //     hand.on('removed', () => {
    //         TWEEN.remove(tween);
    //         tween = null;
    //     });

    //     return hand;
    // }
}

GameLayer.globalName = 'GameLayer';

poolLbl.createFunc = () => {
    let lbl = Helper.createLabel('', 64);
    // lbl.style.dropShadow = true;
    // lbl.style.dropShadowAlpha = 0.3;
    lbl.style.fontWeight = 'bold';
    Helper.setLabelAlignCenter(lbl);
    return lbl;
}

for (let i = 0; i < 5; ++i) {
    poolLbl.put(poolLbl.createFunc());
}
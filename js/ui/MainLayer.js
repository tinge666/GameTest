import * as PIXI from '../libs/pixi'
import TWEEN from '../libs/tween.js'
import SDK from '../libs/sdk'

import Config from '../base/Config'
import Utils from '../base/Utils'

import Helper from '../ui/Helper'
import Button from '../ui/Button'
import GridLayout from '../ui/GridLayout'
import RankLayer from '../ui/RankLayer'
import FeedbackBtn from '../ui/FeedbackBtn'

import ShopSceneMgr from '../mgr/ShopSceneMgr.js';

import DataBus from '../runtime/DataBus'


export default class MainLayer extends PIXI.Container {
    constructor() {
        super();

        this.w = Config.vWidth;
        this.h = Config.vHeight;

        this._root = null;
        this._title = null;
        this._bg = null;
        this._star = null;
        this._start = null;
        this._hand = null;
        this._gold = null;

        this.initUI();

        SDK.showBanner();

        FeedbackBtn.changeDepend(1);

        this.on('removed', () => {
            FeedbackBtn.changeDepend(-1);
        });
    }

    initUI() {
        // let mask = Helper.createMask(0.2);
        // this.addChild(mask);

        // let bg = Helper.createBackground();
        // this.addChild(bg);
        // this._bg = bg;

        // let star = Helper.createStarPnl();
        // this.addChild(star);
        // this._star = star;

        let root = new PIXI.Container();
        let scale = Math.min(1, this.h / Config.designHeight);
        root.scale.set(scale, scale);
        // root.x = (this.w - Config.designWidth * scale) / 2;
        // root.y = (this.h - Config.designHeight * scale) / 2;
        this.addChild(root);
        this._root = root;

        //标题
        {
            let title = this.createTitle();
            title.scale.set(scale, scale);
            title.x = this.w / 2;
            title.y = this.h * 0.3;
            this.addChild(title);
            this._title = title;

            new TWEEN.Tween(title).to({
                y: this.h * 0.15,
            }, Config.mainTitleMoveDuration).start();

            title.on('removed', () => {
                TWEEN.removeByTarget(title);
            })
        }

        //最高分
        {
            let scorePnl = this.createScoreLbl();
            scorePnl.x = this.w / scale / 2;
            scorePnl.y = this.h / scale * 0.15 + this._title.height * 0.5 + 30;
            root.addChild(scorePnl);
        }

        //开始按钮
        {
            let startPnl = this.createStartBtn();
            startPnl.x = this.w / scale / 2;
            startPnl.y = this.h / scale * 0.63;
            root.addChild(startPnl);
            this._start = startPnl;
        }

        //小按钮
        {
            let toolPnl = this.createToolPnl();
            toolPnl.x = this.w / scale / 2;
            toolPnl.y = this.h / scale * 0.75;
            root.addChild(toolPnl);
        }

        //尺子道具
        {
            let btnItem1 = Helper.createImageButton(Utils.texMain('btn_ruler.png'));
            btnItem1.x = this.w / scale - (btnItem1.width * 0.5 + 5);
            btnItem1.y = this.h / scale * 0.5;
            btnItem1.tap = () => {
                console.log('======尺子道具判断分享/视频======');
                let status = Utils.isShareOrVideo(Utils.SharePos.ItemRuler);
                Helper.showRulerItemDialog(status);
            }
            root.addChild(btnItem1);
        }

        //复活道具
        console.log('======复活道具判断能否分享======');
        let canShare = Utils.hasShare(Utils.SharePos.ItemRevive);
        if (canShare) {
            let btnItem1 = Helper.createImageButton(Utils.texMain('btn_revive.png'));
            btnItem1.x = this.w / scale - (btnItem1.width * 0.5 + 5);
            btnItem1.y = this.h / scale * 0.35;
            btnItem1.tap = () => {
                // console.log('======复活道具判断分享/视频======');
                // let status = Utils.isShareOrVideo(Utils.SharePos.ItemRevive);
                Helper.showReviveItemDialog(Utils.ShareVideoRet.Share);
            }
            root.addChild(btnItem1);
        }

        // //新用户进入向导模式
        // if (DataBus.guideMode) {
        //     console.log('主界面进入向导模式');
        //     this.enterGuideMode();
        // }

        Helper.fadeTo(this._root, 0, 1, Config.mainUiFadeDuration, Config.mainTitleMoveDuration);
        
    }
    

    createTitle() {
        let title = new PIXI.Container();

        let titleSp = new PIXI.Sprite(Utils.texLoading('logo.png'));
        titleSp.anchor.set(.5, .5);
        title.addChild(titleSp);

        return title;
    }

    createScoreLbl() {
        let pnl = new PIXI.Container();

        let tip = Helper.createLabel('历史最高分 ' + DataBus.best, 36, 0xff4968);
        Helper.setLabelAlignCenter(tip);
        pnl.addChild(tip);

        return pnl;
    }

    createStartBtn() {
        let pnl = new PIXI.Container();

        let btnStart = Helper.createImageButton(Utils.texMain('btn_start.png'), 0, 0);
        btnStart.onClick(() => {
            
            this.destroy({
                children: true
            });
            this.onBtnStartClick && this.onBtnStartClick();
        });
        pnl.addChild(btnStart);

        return pnl;
    }

    showShop(gift) {
        if (window.GameUi) {
            this.visible = false;
            ShopSceneMgr.show(index => {
                this.destroy({
                    children: true
                });
                this.onBattle && this.onBattle(index);
            }, () => {
                this.visible = true;
            }, gift)
        }
    }

    createToolPnl() {
        let arr = [{
                name: 'shop',
                tex: Utils.texMain('btn_pet.png'),
                func: (e) => {
                    this.showShop();
                }
            },
            {
                name: 'setting',
                tex: Utils.texMain('btn_setting.png'),
                func: () => {
                    Helper.showSettingDialog();
                }
            },
            {
                name: 'rank',
                tex: Utils.texMain('btn_rank.png'),
                func: () => {
                    let layer = new RankLayer();
                    this.addChild(layer);
                }
            },
            {
                name: 'share',
                tex: Utils.texMain('btn_share.png'),
                func: () => {
                    Utils.share(Utils.SharePos.Main);
                }
            },
        ];
        let width = this.w * 0.8;
        let pnl = Helper.createRowBtns(width, arr);
        return pnl;
    }

    getSettingPnl(pos) {
        let name = 'setting_pnl';
        let pnl = this.getChildByName(name);
        if (!pnl) {
            pnl = Helper.createSettingPnl(pos, false, 0, false);
            pnl.name = name;
            pnl.visible = false;
            this.addChild(pnl);
        }
        return pnl;
    }

    // enterGuideMode() {
    //     if (!this._hand) {
    //         let hand = new PIXI.Sprite(Utils.tex('hand.png'));
    //         this._root.addChild(hand);
    //         this._hand = hand;
    //     }
    //     this._hand.tween && TWEEN.remove(this._hand.tween);

    //     this._hand.x = this._start.x + 30;
    //     this._hand.y = this._start.y + 30;

    //     this._hand.tween = new TWEEN.Tween(this._hand.position).to({
    //         x: this._hand.x + 50,
    //         y: this._hand.y + 50
    //     }, 0.5).repeat(Infinity).yoyo(true).start();

    //     this._hand.on('removed', () => {
    //         this._hand.tween && TWEEN.remove(this._hand.tween);
    //         this._hand.tween = null;
    //     });
    // }
}

MainLayer.globalName = 'MainLayer';
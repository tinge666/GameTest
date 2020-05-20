import * as PIXI from '../libs/pixi'
import TWEEN from '../libs/tween.js'
import SDK from '../libs/sdk'

import Config from '../base/Config'
import Utils from '../base/Utils'

import Helper from '../ui/Helper'
import Button from '../ui/Button'
import ListView from '../ui/ListView'
import GridLayout from '../ui/GridLayout'
import Progress from '../ui/Progress'
import ScrollBar from '../ui/ScrollBar'
import FeedbackBtn from '../ui/FeedbackBtn.js';

import LevelMgr from '../mgr/LevelMgr.js';
import SoundMgr from '../mgr/SoundMgr';

import DataBus from '../runtime/DataBus.js';

export default class ShopLayer extends PIXI.Container {
    constructor() {
        super();

        this.w = Config.vWidth;
        this.h = Config.vHeight;

        //root参考尺寸
        this._rw = this.w;
        this._rh = this.h - 100;

        this.onBattle = null;
        this.onClose = null;
        this.onSelectPet = null;
        this.onTouchMove = null;

        this._root = null;
        this._selectIcon = null;
        this._btnList = [];

        this._lbl = null;
        this._progress = null;
        
        this._lblNick = null;
        this._lblDesc = null;

        this._friendBtn = null;
        this._battleBtn = null;

        this._selectIndex = 0;
        this._battleLvl = -1;

        FeedbackBtn.changeMask(1);

        SDK.hideBanner();

        //移除时操作才生效
        this.on('removed', () => {
            FeedbackBtn.changeMask(-1);

            SDK.showBanner();

            SoundMgr.instance.stopAllMusic();
        });

        //触摸
        this.createTouchUI();

        this.initUI();
        this.updateProgress();

        SDK.hideLoading();
    }

    initUI() {
        //容器
        this.addContainer();

        //此处不添加背景, 因为背景会遮挡3D场景

        //标题
        this.addTitle();

        //添加对话框
        this.addDialog();

        //挑战按钮
        this.addBattleBtn();

        //赠送好友按钮
        this.addFriendBtn();

        //添加进度条
        this.addProgress();

        //添加内容项
        this.addContent();

        //关闭按钮
        this.addCloseBtn();
    }


    addCloseBtn() {
        let btn = Helper.createButton({
            tex: Utils.texShop('btn_back.png'),
            x: 70,
            y: 70 + (Config.isIPhoneX ? 40 : 0),
            func: () => {
                this.close();
            }
        });
        this.addChild(btn);
    }

    addContainer() {
        let root = new PIXI.Container();
        // let scale = Math.min(1, this.h / Config.designHeight);
        let scale = 1;
        root.x = (this.w - this._rw * scale) / 2;
        root.y = (this.h - this._rh * scale) / 2;
        root.scale.set(scale, scale);

        this.addChild(root);
        this._root = root;
    }

    addTitle() {
        let sp = new PIXI.Sprite(Utils.texShop('title.png'));
        sp.anchor.set(.5, .5);
        sp.x = this._rw * 0.5;
        sp.y = this._rh * 0.05 + (Config.isIPhoneX ? 40 : 0);
        this._root.addChild(sp);
    }

    addDialog() {
        let bg = new PIXI.Sprite(Utils.texShop('dialog.png'));
        bg.anchor.set(.5, .5);
        bg.x = this._rw * 0.5;
        bg.y = this._rh * 0.17 + (Config.isIPhoneX ? 40 : 0);
        this._root.addChild(bg);

        let w = bg.width * 0.5,
            h = bg.height * 0.5;

        let nick = Helper.createLabel('喵大人：', 28, 0xfc659c);
        nick.x = -w + 41;
        nick.y = -h + 15;
        bg.addChild(nick);
        this._lblNick = nick;

        let plus = Helper.createLabel('(基础分+1)', 24, 0xdf467e);
        plus.x = -w + 201;
        plus.y = -h + 15;
        bg.addChild(plus);
        this._lblPlus = plus;
        

        let desc = Helper.createLabel('你听过《鸟之诗》吗？\n能走完全程就送给你！', 24, 0xdf467e);
        Helper.setLabelAlignCenter(desc);
        desc.x = 0;
        desc.y = -h + 77;
        bg.addChild(desc);
        this._lblDesc = desc;
    }

    addBattleBtn() {
        let btn = Helper.createButton({
            tex: Utils.texShop('btn_battle.png'),
            x: this._rw * 0.5,
            y: this._rh - 460,
            func: () => {
                this.onBattle && this.onBattle(this._selectIndex);
                this.close();
            }
        });
        btn.visible = false;
        this._root.addChild(btn);
        this._battleBtn = btn;
    }

    addFriendBtn() {
        let btn = Helper.createButton({
            tex: Utils.texShop('btn_friend.png'),
            x: this._rw * 0.5,
            y: this._rh - 460,
            func: () => {
                // this.close();
                Utils.share(Utils.SharePos.Music, {
                    sound: this._selectIndex,
                });
            }
        });
        btn.visible = false;
        this._root.addChild(btn);
        this._friendBtn = btn;
    }

    addProgress() {
        let progressWidth = 700;
        //进度条
        let progress = new Progress(
            Utils.texShop('progress1.png'), Utils.texShop('progress2.png'), progressWidth
        );
        progress.pivot.set(progressWidth * 0.5, progress.height * 0.5);
        progress.x = this._rw * 0.5;
        progress.y = this._rh - 370;
        progress.setPercent(8 / 39);
        this._root.addChild(progress);
        this._progress = progress;

        //进度文本
        let lbl = Helper.createLabel('8/39', 32, 0x76cfff);
        lbl.anchor.set(0, 0);
        lbl.x = 10;
        lbl.y = this._rh - 420;
        // lbl.alpha = 0.8;
        this._root.addChild(lbl);
        this._lbl = lbl;
    }

    addContent() {

        //内容容器尺寸
        let tw = 700;
        let th = 350;

        //内容容器
        let tab = new PIXI.Container();
        tab.x = (this._rw - tw) / 2;
        tab.y = this._rh - 350;
        this._root.addChild(tab);

        //数据

        //项数量
        let length = LevelMgr.getLevelsLength();

        //列表容器
        let lv = new ListView(tw, th + this.h - this._rh);
        lv.useMask = false;
        lv.direction = ListView.Direction.Horizontal;
        tab.addChild(lv);

        //列表内容
        let content = new GridLayout(th, 140, 2, GridLayout.Direction.Horizontal);

        //添加内容
        for (let i = 0; i < length; ++i) {
            content.addChild(this.createItem(i));
        }
        content.refresh();
        lv.setContent(content);

        //创建选中图标
        let sp = new PIXI.Sprite(Utils.texShop('selected.png'));
        sp.anchor.set(.5, .5);
        // sp.position.set(0, -110);
        sp.visible = false;
        this._selectIcon = sp;

    }

    /**
     * 创建项
     * @param {*} i 序号
     */
    createItem(i) {
        //数据
        let obj = LevelMgr.getPetData(i);

        //创建按钮
        let btn = new Button(Utils.texShop('unlock.png'));
        btn.name = 'btn' + (i + 1);
        btn.onClick(() => {
            this.selectBtn(i);
        });
        btn.setSlideCancelTap(true);

        //创建宠物缩略图
        let pet = new PIXI.Sprite(Utils.texPet(obj.pet));
        pet.anchor.set(.5, .5);
        pet.visible = false;
        btn.addChild(pet);
        btn.thumb = pet;

        //创建右下角标
        let corner = new PIXI.Sprite(Utils.texShop('solved.png'));
        corner.anchor.set(1, 1);
        corner.x = btn.width * 0.5;
        corner.y = btn.height * 0.5;
        corner.visible = false;
        btn.addChild(corner);
        btn.corner = corner;


        this._btnList[i] = btn;

        this.updateBtnStyle(i);

        return btn;
    }

    setBattleLvl(lvl) {
        this._battleLvl = lvl;
        this.selectBtn(lvl);
        this.updateBtnStyle(lvl);
    }

    updateBtnStyle(i) {
        let isPass = (DataBus.petList.indexOf(i) > -1);
        let isBattle = (this._battleLvl == i);

        let btn = this._btnList[i];
        if (btn) {
            btn.corner.visible = isPass;
            btn.thumb.visible = isPass || isBattle;
            btn.texture = (isPass || isBattle) ? Utils.texShop('unlock.png') : Utils.texShop('lock.png');
            // btn.interactive = isPass;
        }
    }

    selectBtn(i) {
        this._selectIndex = i;

        let obj = LevelMgr.getPetData(i);
        let isPass = (DataBus.petList.indexOf(i) > -1);
        let isBattle = (this._battleLvl == i);

        //赠送或挑战按钮
        this._friendBtn.visible = isPass;
        this._battleBtn.visible = (!isPass && isBattle);

        //显示选中样式
        let sp = this._selectIcon;
        let btn = this._btnList[i];
        if (sp && btn) {
            sp.visible = true;
            btn.addChild(sp);
        }

        //文本提示
        this._lblNick.text = (isPass || isBattle) ? obj.petName + ':' : '未知精灵:';
        this._lblPlus.text = isPass ? '(基础分+1)' : '';
        this._lblDesc.text = (
            isPass ?
            `你有喜欢《${obj.title}》的朋友吗?\n送给ta! ta一定喜欢!` :
            isBattle ?
            `想要《${obj.title}》的八音盒? \n能走完全程就送给你!` :
            `再向前走一段, 八音盒就是你的了!`
        );

        //放歌
        SoundMgr.instance.stopAllMusic();
        if(isPass || isBattle) {
            this.playMusic(i);
        }

        //通知3D场景, 参数(序号, 是灰色)
        this.onSelectPet && this.onSelectPet(i, (!isPass && !isBattle));
    }

    playMusic(i) {
        clearTimeout(this._timer);
        SoundMgr.instance.stopAllMusic();
        this._timer = setTimeout(() => {
            LevelMgr.playMusic(i);
        }, 500);
    }

    updateProgress() {
        this.setProgress(DataBus.petList.length, LevelMgr.getLevelsLength());
    }

    setProgress(count, total) {
        if (total == 0) {
            this._lbl.visible = false;
            this._progress.visible = false;
        } else {
            this._lbl.visible = true;
            this._progress.visible = true;
            this._lbl.text = count + '/' + total;
            this._progress.setPercent(count / total);
        }
    }

    createTouchUI() {

        //用于扩展this触摸面积
        let g = Helper.createRect(this.w, this.h, 0, 0, 0);
        g.interactive = false;
        this.addChild(g);

        let o = {
            dx: 0,
            dy: 0,
            x: 0,
            y: 0,
            ox: 0,
            oy: 0,
            lx: 0,
            ly: 0,
        };
        let obj = {};
        let onTouchStart = e => {
            let x = e.data.global.x,
                y = e.data.global.y;

            // e.preventDefault && e.preventDefault();
            e.stopPropagation && e.stopPropagation();
            o.x = o.ox = o.lx = x;
            o.y = o.oy = o.ly = y;
            o.dx = o.dy = 0;
            obj.enableTouch();

        }
        let onTouchMove = e => {
            o.lx = o.x;
            o.ly = o.y;
            o.x = e.data.global.x;
            o.y = e.data.global.y;
            o.dx = o.x - o.lx;
            o.dy = o.y - o.ly;
            this.onTouchMove && this.onTouchMove(o);
        }
        let onTouchEnd = e => {
            onTouchMove(e);
            obj.disableTouch();
        }

        this.interactive = true;
        this.on('pointerdown', onTouchStart, this);
        obj.enableTouch = () => {
            this.on('pointermove', onTouchMove, this);
            this.on('pointerup', onTouchEnd, this);
            this.on('pointerupoutside', onTouchEnd, this);
            this.on('pointercancel', onTouchEnd, this);
        }
        obj.disableTouch = () => {
            this.off('pointermove', onTouchMove, this);
            this.off('pointerup', onTouchEnd, this);
            this.off('pointerupoutside', onTouchEnd, this);
            this.off('pointercancel', onTouchEnd, this);
        }
    }

    close() {
        this.onClose && this.onClose();
        this.onClose = null;
        this.destroy({
            children: true
        });
    }
}

ShopLayer.globalName = 'ShopLayer';
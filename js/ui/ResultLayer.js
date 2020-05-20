import * as PIXI from '../libs/pixi'
import TWEEN from '../libs/tween.js'
import SDK from '../libs/sdk'

import Config from '../base/Config'
import Utils from '../base/Utils'

import Helper from '../ui/Helper'
import Button from '../ui/Button'
import ResultRank from '../ui/ResultRank'
import SubMgr from '../ui/SubMgr.js';

import ShopSceneMgr from '../mgr/ShopSceneMgr.js';

import DataBus from '../runtime/DataBus'


export default class ResultLayer extends PIXI.Container {
    constructor() {
        super();

        this.w = Config.vWidth;
        this.h = Config.vHeight;

        this.onRestart = null;
        this.onHome = null;

        //结果界面, 关掉所有子域缓存层, 数据重新获取
        SubMgr.closeAll();

        this.initUI();

        SDK.showBanner();
    }

    initUI() {
        //遮罩
        // let mask = Helper.createMask(0.2);
        // this.addChild(mask);

        let bg = Helper.createMask(0.3);
        // let bg = Helper.createBackground(Utils.texBg('bg.jpg'), 0.5);
        this.addChild(bg);
        Helper.fadeTo(bg, 0, 1, 1);

        //容器, 用于将所有元素置于720*1280空间内
        let root = new PIXI.Container();
        let scale = Math.min(1, this.h / Config.designHeight);
        root.scale.set(scale, scale);
        root.x = (this.w - Config.designWidth * scale) / 2;
        root.y = (this.h - Config.designHeight * scale) / 2;
        this.addChild(root);

        let btn, lbl;
        let centerX = this.w / 2;

        //分数标题
        lbl = new PIXI.Sprite(Utils.texResult('result_score.png'));
        lbl.anchor.set(.5, .5);
        lbl.x = centerX;
        lbl.y = 100;
        root.addChild(lbl);

        //分数
        lbl = Helper.createLabel(DataBus.score, 120, 0xffd658);
        Helper.setLabelAlignCenter(lbl);
        lbl.x = centerX;
        lbl.y = 190;
        root.addChild(lbl);

        //新记录
        if(DataBus.newRecord) {
            let rec = Helper.createLabel('新记录!!', 50, 0xffffff);
            Helper.setLabelAlignCenter(rec);
            rec.x = centerX;
            rec.y = 280;
            root.addChild(rec);

            Helper.scaleTo(rec, 0.01, 1, 0.5, TWEEN.Easing.Elastic.Out);
        }

        //一行数据
        let banner = this.createBanner();
        banner.x = centerX;
        banner.y = 380;
        root.addChild(banner);

        // 排行榜
        let rank = new ResultRank();
        rank.x = (this.w - rank.w) / 2;
        rank.y = 450;
        root.addChild(rank);

        //一行按钮
        let btns = this.createRow();
        btns.x = this.w / 2;
        btns.y = 988;
        root.addChild(btns);
    }

    createBanner() {
        let pnl = new PIXI.Container();

        let bg = new PIXI.Sprite(Utils.texResult('result_banner.png'));
        bg.anchor.set(.5, .5);
        bg.width = this.w;
        pnl.addChild(bg);

        let xArr = [-230, 0, 230];
        let valueArr = [DataBus.best.toLocaleString(), DataBus.petList.length, DataBus.giftList.length];
        let nameArr = ['历史最高', '解锁精灵', '发现精灵'];

        for(let i = 0; i < 3; ++i) {
            let lbl = Helper.createLabel(valueArr[i], 28, 0x853cff);
            Helper.setLabelAlignCenter(lbl);
            lbl.x = xArr[i];
            lbl.y = -28;
            pnl.addChild(lbl);

            lbl = Helper.createLabel(nameArr[i], 28, 0x853cff);
            Helper.setLabelAlignCenter(lbl);
            lbl.x = xArr[i];
            lbl.y = 28;
            pnl.addChild(lbl);
        }

        return pnl;
    }

    createRow() {
        let pnl = Helper.createRowBtns(this.w * 0.8, [{
                name: 'home',
                tex: Utils.texResult('btn_home.png'),
                func: (e) => this.returnToMainLayer(),
            },
            {
                name: 'battle',
                tex: Utils.texResult('btn_battle.png'),
                func: (e) => Utils.share(Utils.SharePos.Battle),
            },
            {
                name: 'restart',
                tex: Utils.texResult('btn_retry.png'),
                func: () => this.restartGame(),
            },
        ]);
        return pnl;
    }

    returnToMainLayer() {
        // window.main && window.main.gotoMainLayer();
        // window.MainLayer && window.MainLayer.showNormalAnimation();

        this.onHome && this.onHome();

        this.destroy({
            children: true
        });

        //清理内存
        wx.triggerGC();
    }

    restartGame() {
        //清理内存
        wx.triggerGC();

        this.onRestart && this.onRestart();

        // window.main && window.main.restartGame();

        this.destroy({
            children: true
        });
    }
}

ResultLayer.globalName = 'ResultLayer';
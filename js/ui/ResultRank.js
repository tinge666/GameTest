import * as PIXI from '../libs/pixi'

import Utils from '../base/Utils'

import SubMgr from '../ui/SubMgr'
import Helper from '../ui/Helper.js';
import RankLayer from '../ui/RankLayer'


export default class ResultRank extends PIXI.Container {
    constructor(onRemoved) {
        super();

        this.w = 687;
        this.h = 420;

        this._onRemoved = onRemoved || null;

        this.initUi();
    }

    initUi() {

        //列表项背景
        for (let i = 0; i < 3; ++i) {
            let item = this.createItem();
            item.position.set((i + 0.5) * this.w / 3, 0);
            this.addChild(item);
        }

        //按钮
        let btn = Helper.createButton({
            tex: Utils.texResult('btn_full_rank.png'),
            x: this.w * .5,
            y: this.h,
            func: () => {
                let parent = this.parent;
                parent && (parent.visible = false);
                Helper.showRankLayer(RankLayer.RankType.Friends, '', () => {
                    SubMgr.switchToMode('result', this.w, this.h, {
                        msg: 'result',
                        action: 'show'
                    }, 100);
                    parent && (parent.visible = true);
                    
                });
            },
        });
        this.addChild(btn);

        //数据域
        this.addSubLayer();
    }

    createItem() {
        let pnl = new PIXI.Container();

        //边框
        let border = new PIXI.Sprite(Utils.texResult('result_item_border.png'));
        border.position.set(- 178 / 2, 0);
        pnl.addChild(border);

        return pnl;
    }

    addSubLayer() {
        this.sub = SubMgr.createSprite('result', this.w, this.h, {
            msg: 'result',
            action: 'show'
        }, {
            msg: 'result',
            action: 'hide'
        }, 100, this._onRemoved);
        this.addChild(this.sub);
    }
}
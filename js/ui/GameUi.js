import * as PIXI from '../libs/pixi'

import LoadingLayer from '../ui/LoadingLayer'
import MainLayer from '../ui/MainLayer'
import GameLayer from '../ui/GameLayer'
import ResultLayer from '../ui/ResultLayer'
import ShopLayer from '../ui/ShopLayer'
import ReviveLayer from '../ui/ReviveLayer'
import InsideAds2 from '../ui/InsideAds2'

export default class GameUi {
    constructor() {

    }

    static init(app) {
        this.app = app;
        this.stage = app.stage;

        this._pnlUi = new PIXI.Container();
        this.stage.addChild(this._pnlUi);

        this._pnlAds = new PIXI.Container();
        this.stage.addChild(this._pnlAds);
    }

    static showAd() {
        if(!this._ad) {
            this._ad = new InsideAds2();
            this._pnlAds.addChild(this._ad);
        }
        this._ad.show();
    }
    static hideAd() {
        this._ad && this._ad.hide();
    }

    static _showLayer(C) {
        let layer = new C();
        this._pnlUi.addChild(layer);

        window[C.globalName] = layer;
        this[C.globalName] = layer;
        // console.log(C.name, ' 已添加. 节点数:', this._pnlUi.children.length);

        layer.on('removed', ()=>{
            // console.log(C.name, ' 已移除. 节点数:', this._pnlUi.children.length);
            window[C.globalName] = null;
            this[C.globalName] = null;
        });

        return layer;
    }

    static removeLayer(name) {
        name += 'Layer';
        this[name] && this[name].destroy({
            children: true
        });
        this[name] = null;
        window[name] = null;
    }

    static showLayer(name) {
        name = 'show' +name + 'Layer';
        return this[name] ? this[name]() : null;
    }

    static showLoadingLayer() {
        return this._showLayer(LoadingLayer);        
    }

    static showMainLayer() {
        // let layer = new MainLayer();
        // this._pnlUi.addChild(layer);
        // return layer;
        return this._showLayer(MainLayer);
    }

    static showGameLayer() {
        return this._showLayer(GameLayer);
    }

    static showShopLayer() {
        return this._showLayer(ShopLayer);
    }

    static showReviveLayer() {
        return this._showLayer(ReviveLayer);
    }

    static showResultLayer() {
        return this._showLayer(ResultLayer);
    }
}

GameUi.app = null;
GameUi.stage = null;


window.GameUi = GameUi;
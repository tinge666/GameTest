import * as PIXI from '../libs/pixi'
import TWEEN from '../libs/tween'
import SDK from '../libs/sdk'

import Utils from '../base/Utils'
import Config from '../base/Config'

import ListView from '../ui/ListView'
import GridLayout from '../ui/GridLayout'
import ScrollBar from '../ui/ScrollBar'
import Helper from '../ui/Helper';
import Button from '../ui/Button';

import DataBus from '../runtime/DataBus';

let W = 550,
    H = 630;

export default class InsideAds2 extends PIXI.Container {
    constructor() {
        super();

        this._index = 0;

        this._layer = null;
        this._btn = null;
        this._content = null;
        this._tween = null;
        this.__mask = null;
        this._pnl = null;

        this._status = 'none';

        InsideAds2.instance = this;

        this._getMask();

        this.on('removed', () => {
            SDK.insideAds.onChanged = null;
            this._tween && TWEEN.remove(this._tween);
        })
    }

    /**
     * 外部调用, 存在内推广告则即刻显示按钮
     * 不存在则在加载好内推广告数据后显示按钮
     */
    show() {
        this._onDataChanged();
        SDK.insideAds.onChanged = this._onDataChanged.bind(this);
    }

    /**
     * 外部调用, 关闭按钮显示, 关闭内推广告加载回调
     */
    hide() {
        this._hidePnl();
        SDK.insideAds.onChanged = null;
    }

    /**
     * 数据改变
     */
    _onDataChanged() {
        if (SDK.insideAds.hasAds()) {
            this._list = SDK.insideAds.list;
            this._showPnl();
            this._updateContent();
        } else {
            this._list = [];
            this._hidePnl();
        }
    }

    _showPnl() {
        let pnl = this._getPnl();
        pnl.visible = true;
    }
    _hidePnl() {
        this._pnl && (this._pnl.visible = false);
    }
    _getPnl() {
        if(!this._pnl) {
            let pnl = new PIXI.Container();
            pnl.y = Config.vHeight * 0.5;
            this.addChild(pnl);
            this._pnl = pnl;

            this._createBtn();
            this._createLayer();
        }
        return this._pnl;
    }

    _createBtn() {
        if (!this._btn) {
            //按钮
            // let btn = Helper.createTextButton('更\n多\n好\n玩', 0, 0, () => {
            let btn = Helper.createImageButton(Utils.texAd2('btn.png'), 0, 0, () => {
                if(this._status == 'none') {
                    this._showMore();
                    this._showMask();
                } else {
                    this._hideMask();
                    this._hideMore();
                }
            });
            // btn.style.lineHeight = 36;
            btn.x = btn.width * .5 - 10;
            btn.y = 0;
            this._pnl.addChild(btn);
            this._btn = btn;

            this._runBtnAction();

            //箭头
            let arrow = new PIXI.Sprite(Utils.texAd2('arrow.png'));
            arrow.anchor.set(.5, .5);
            arrow.tint = 0x000000;
            arrow.alpha = 0.5;
            btn.addChild(arrow);
            this._arrow = arrow;

            //红点
            let red = new PIXI.Sprite(Utils.texAd2('red1.png'));
            red.anchor.set(.5, .5);
            red.x = 30;
            red.y = -28;
            btn.addChild(red);
            this._red = red;
        }
        return this._btn;
    }

    _runBtnAction() {
        let btn = this._btn;

        btn.tween && TWEEN.remove(btn.tween);
        
        //按钮动画
        btn.tween = new TWEEN.Tween(btn.scale).to({
            x: 1.1,
            y: 1.1
        }, 0.5).yoyo(true).repeat(Infinity).start();
        btn.removeFunc = () => {
            TWEEN.remove(btn.tween);
            btn.tween = null;
            btn.removeFunc = null;
        };
        btn.on('removed', btn.func);
    }
    _stopBtnAction() {
        let btn = this._btn;

        btn.tween && TWEEN.remove(btn.tween);
        btn.tween = null;
        btn.removeFunc && btn.off('removed', btn.removeFunc);
        btn.removeFunc = null;

        btn.scale.set(1, 1);
    }

    _showMask() {
        let mask = this._getMask();
        mask.visible = true;
        mask.interactive = true;
        Helper.fadeTo(mask, mask.alpha, 1, 0.5);
    }

    _hideMask() {
        let mask = this._getMask();
        if(mask) {
            mask.interactive = false;
            Helper.fadeTo(mask, mask.alpha, 0, 0.5, 0, null, () => {
                mask.visible = false;
            });
        }
    }

    _getMask() {
        if(!this.__mask) {
            let mask = Helper.createMask(0.2, () => {
                this._hideMore();
                this._hideMask();
            });
            mask.interactive = false;
            mask.visible = false;
            this.addChild(mask);
            this.__mask = mask;
        }
        return this.__mask;
    }


    _showMore() {
        this._arrow.rotation = Math.PI;
        this._red.visible = false;
        this._stopBtnAction();
        // let srcX = 0;
        let srcX = this._pnl.x;
        let destX = W;
        this._runAnimation(this._pnl, srcX, destX, 0.3, TWEEN.Easing.Quadratic.Out);
        this._status = 'more';
    }

    _hideMore() {
        // let srcX = W;
        let srcX = this._pnl.x;
        let destX = 0;
        this._runAnimation(this._pnl, srcX, destX, 0.3, TWEEN.Easing.Quadratic.In, () => {
            this._arrow.rotation = 0;
            this._updateBadge();
            this._runBtnAction();
        });
        this._status = 'none';
    }

    _createLayer() {
        if (!this._layer) {
            let w = W,
                h = H;
                
            // let layer = Helper.createRect(w, h, 0x0, 0.6, 8);
            let layer = new PIXI.mesh.NineSlicePlane(Utils.texAd2('bg.png'), 80, 80, 80, 80);
            layer.width = w;
            layer.height = h;
            layer.pivot.set(0, h * .5);

            this._pnl.addChild(layer);
            layer.x = -w;
            layer.y = 0;
            this._layer = layer;

            //列表
            let lv = new ListView(w - 50, h - 50);
            lv.x = 25;
            lv.y = 25;
            layer.addChild(lv);

            //列表内容
            let content = new GridLayout(w - 50, 180, 4);
            this._content = content;

            //添加内容
            this._updateContent();
            lv.setContent(content);

            //标题
            let title = new PIXI.Sprite(Utils.texAd2('title.png'));
            title.anchor.set(.5, .5);
            title.scale.set(.7, .7);
            title.x = w * .5;
            title.y = 4;
            layer.addChild(title);
        }

        return this._layer;
    }

    //刷新红点
    _updateBadge() {
        let hasNew = false;
        if(Array.isArray(this._list)) {
            let len = this._list.length;
            if(len > DataBus.ad2List.length) {
                hasNew = true;
            } else {
                for(let i = 0; i < len; ++i) {
                    if(DataBus.ad2List.indexOf(this._list[i].app_id) == -1) {
                        hasNew = true;
                        break;
                    }
                }
            }
        }
        this._red.visible = hasNew;
    }

    _updateContent() {
        if(this._content && Array.isArray(this._list) && this._list.length > 0) {
            this._content.removeChildren();
            this._list.forEach(o => {
                let icon = this._createIcon(o, 93, 35, () => {
                    let page = 'get_list';
                    const onSuccess = () => {
                    if(DataBus.ad2List.indexOf(o.app_id) == -1) {
                        DataBus.ad2List.push(o.app_id);
                        DataBus.saveVar('ad2List');
                        icon._red.visible = false;
                        // this._updateBadge();
                        }
                        SDK.reportAdsClick(page, o.id);
                    }
                    if (o.qrcode_flag == 1) {
                        page = 'get_list_scan';
                        SDK.showImage(o.qrcode_url, onSuccess);
                    } else {
                        SDK.showInsideAds(o, onSuccess);
                    }

                });
                icon.data = o;
                this._content.addChild(icon);
            });
            this._content.refresh();
        }
        this._updateBadge();
    }

    _createIcon(data, width, lblHeight, func) {
        let img = data.icon;
        let txt = data.name

        let pnl = new PIXI.Container();

        let padding = 5;

        // let bg = Helper.createRect(width, width + padding + lblHeight, 0xff0000, 0.3, 0);
        // pnl.addChild(bg);

        //图标
        let icon = new PIXI.Sprite();
        pnl.addChild(icon);
        icon.width = icon.height = width;
        let tex = PIXI.Texture.fromImage(img);
        icon.texture = tex;
        let updateSize = () => {
            icon.width = icon.height = width;
        };
        let base = tex.baseTexture;
        base.hasLoaded ? updateSize() : base.once('loaded', updateSize);

        //边框
        let border = new PIXI.Sprite(Utils.texAd2('kuang.png'));
        border.anchor.set(.5, .5);
        border.x = width * .5;
        border.y = width * .5;
        pnl.addChild(border);

        //标签
        let lbl = Helper.createLabel(txt, lblHeight * 0.6, 0xffffff);
        Helper.setLabelAdaptSize(lbl, width + 20, lblHeight);
        Helper.setLabelAlignCenter(lbl);
        lbl.x = width * 0.5;
        lbl.y = width + padding + lblHeight * 0.5;
        pnl.addChild(lbl);

        //红点
        let red = new PIXI.Sprite(Utils.texAd2('red.png'));
        red.anchor.set(.5, .5);
        red.x = width - 5;
        red.y = 5;
        red.visible = (DataBus.ad2List.indexOf(data.app_id) == -1);
        pnl.addChild(red);
        pnl._red = red;


        let height = width + padding + lblHeight;
        pnl.pivot.x = width * 0.5;
        pnl.pivot.y = height * 0.5;

        Button.makeButton(pnl);
        // pnl.interactive = true;
        // pnl.buttonMode = true;
        pnl.onClick(event => {
            func && func();
        });
        pnl.setSlideCancelTap(true);

        return pnl;
    }

    _runAnimation(layer, srcX, destX, duration, ease, callback) {
        this._tween && TWEEN.remove(this._tween);
        layer.x = srcX;
        this._tween = new TWEEN.Tween(layer).to({
            x: destX,
        }, duration).easing(ease ? ease : TWEEN.Easing.Linear.None)
        .onComplete(() => {
            callback && callback();
        })
        .start();
    }
}
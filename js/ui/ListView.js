import * as PIXI from '../libs/pixi'
import TWEEN from '../libs/tween'

import Config from '../base/Config'
import Utils from '../base/Utils'

import Helper from '../ui/Helper'
import Button from '../ui/Button'
import ScrollBar from '../ui/ScrollBar'


/**
 * 滑动列表
 * 只支持纵向滑动
 * 支持惯性
 * 支持ScrollBar作为滑动条
 * 触摸时显示滑动条, 惯性滚动停止后隐藏滑动条
 */
export default class ListView extends PIXI.Container {
    constructor(w, h) {
        super();

        this.w = w;
        this.h = h;

        this.direction = ListView.Direction.Vertical;

        this.content = null;
        this.mask = null;
        this.scrollBar = null;

        this.useMask = true;

        this._contentHeight = 0;

        this._maxOffset = 0;
        this._prevPosY = 0;
        this._offsetY = 0;

        this._v = [];
        this._ts = 0;

        this.interactive = true;
        this.on("pointerdown", this._onTouchStart, this);

        this.on('removed', () => {
            this.tween && TWEEN.remove(this.tween);
            this.tween = null;
        });
    }

    setContent(content) {
        this.content && this.content.destroy({children: true});
        this.content = content;
        this.addChild(content);

        this.updateContentSize();

        //用于遮罩及触摸面积
        if (!this.__mask) {
            this.__mask = new PIXI.Graphics();
            this.__mask.beginFill(0, 0);
            this.__mask.drawRect(0, 0, this.w, this.h);
            this.__mask.endFill();
            this.addChild(this.__mask);
        }
        if(this.useMask) {
            this.mask = this.__mask;
        } else {
            this.mask = null;
        }
    }

    updateContentSize() {
        let rect = new PIXI.Rectangle();
        this.content.getBounds(false, rect);
        // let contentHeight = Math.max(this.h, rect.bottom + rect.top + 10);
        let contentHeight = (this.direction == ListView.Direction.Vertical) ?
            Math.max(this.h, rect.height + 30) :
            Math.max(this.w, rect.width + 30);
        this._contentHeight = contentHeight;

        this._maxOffset = (this.direction == ListView.Direction.Vertical) ?
            Math.max(0.1, contentHeight - this.h) :
            Math.max(0.1, contentHeight - this.w);
    }

    setContentHeight(contentHeight) {
        contentHeight = (this.direction == ListView.Direction.Vertical) ?
            Math.max(this.h, contentHeight + 30) :
            Math.max(this.w, contentHeight + 30);
        this._contentHeight = contentHeight;

        this._maxOffset = (this.direction == ListView.Direction.Vertical) ?
            Math.max(0.1, contentHeight - this.h) :
            Math.max(0.1, contentHeight - this.w);
    }

    setScrollBar(bar) {
        this.scrollBar = bar;
        bar.setLen(this.h, this.h * this.h / this._contentHeight);
        this.updateScrollBarPercent();
        bar.fadeOut();
    }

    updateScrollBarPercent(){
        //更新滑动条显示
        //基本原理: 假想列表显示区域为滑动条的滑动块, 列表实际内容为滑动条的背景条
        //这里传递的是显示区域上边缘在 实际内容上的位置的比例
        this.scrollBar && this.scrollBar.setPercent(-this.content.y / this._contentHeight);
    }

    _bindTouch() {
        this.on("pointermove", this._onTouchMove, this);
        this.on("pointerup", this._onTouchCancel, this);
        this.on("pointerupoutside", this._onTouchCancel, this);
        this.on("pointercancel", this._onTouchCancel, this);
    }
    _unbindTouch() {
        this.off("pointermove", this._onTouchMove, this);
        this.off("pointerup", this._onTouchCancel, this);
        this.off("pointerupoutside", this._onTouchCancel, this);
        this.off("pointercancel", this._onTouchCancel, this);
    }

    _onTouchStart(e) {
        let pos = e.data.global;
        if (pos) {
            this._prevPosY = (this.direction == ListView.Direction.Vertical) ? pos.y : pos.x;
            this._ts = Date.now();
        }
        this._v.length = 0;
        this.tween && TWEEN.remove(this.tween);
        this.tween = null;
        this._bindTouch();
        this._realScaleY = this._getRealScaleY();

        if(this.scrollBar){
            this.scrollBar.fadeIn();
        }
        e.stopPropagation && e.stopPropagation();
    }
    _onTouchMove(e) {
        let pos = e.data.global;
        if (pos) {
            let prop = (this.direction == ListView.Direction.Vertical) ? 'y' : 'x';

            let inc = (pos[prop] - this._prevPosY) / this._realScaleY;
            this._offsetY += inc;
            this._prevPosY = pos[prop];
            this.content[prop] = this._offsetY;

            if(this.scrollBar){
                this.scrollBar.visible = true;
                this.updateScrollBarPercent();
            }

            //惯性相关
            let ts = Date.now();
            this._v.push({
                s: inc,
                t: ts - this._ts
            })
            if(this._v.length > 3){
                this._v.shift();
            }
            this._ts = ts;
        }
    }
    _onTouchCancel(e) {
        //处理惯性
        let s = 0, t = 0;
        this._v.forEach(v=>{
            s += v.s;
            t += v.t;
        });
        if( t > 0){
            let v = s / t;
            let a = 5 / 1000;
            t = Math.abs(v) / a;
            s = 0.5 * v * t;
            this._offsetY += s;
        }
        t = Math.min(1, t / 1000);

        //处理回弹
        if (this._offsetY > 0) {
            this._offsetY = 0;
            t = 0.3;
        } else if (-this._offsetY > this._maxOffset) {
            this._offsetY = -this._maxOffset;
            t = 0.3;
        }

        //动画
        this.tween && TWEEN.remove(this.tween);
        this.tween = null;
        let prop = (this.direction == ListView.Direction.Vertical) ? 'y' : 'x';
        
        if (this._offsetY !== this.content[prop]) {
            let dest = {};
            dest[prop] = this._offsetY;

            if(this.scrollBar){
                this.tween = new TWEEN.Tween(this.content).to(dest, t).easing(TWEEN.Easing.Quadratic.Out).onUpdate(() => {
                    if(this.scrollBar) {
                        this.scrollBar.visible = true;
                        this.updateScrollBarPercent();
                    }
                }).onComplete(() => {
                    if(this.scrollBar){
                        this.scrollBar.fadeOut(0.5);
                    }
                }).start();
            }else{

                this.tween = new TWEEN.Tween(this.content).to(dest, t).easing(TWEEN.Easing.Quadratic.Out).start();
            }
        }

        this._unbindTouch();
    }

    _getRealScaleY() {
        let ret = 1;
        let node = this;
        let prop = (this.direction == ListView.Direction.Vertical) ? 'y' : 'x';
        while(node) {
            ret *= node.scale[prop];
            node = node.parent;
        }
        return ret;
    }
}

ListView.Direction = {
    Vertical: 0,
    Horizontal: 1,
}
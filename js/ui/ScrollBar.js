import * as PIXI from '../libs/pixi'

import TWEEN from '../libs/tween.js'

/**
 * 滑动条
 * 配合ListView使用
 * 因为测试材质的关系, 默认使用了水平方向, 纵向需要旋转90度
 */
export default class ScrollBar extends PIXI.Container {
    constructor(barTex, bgTex) {
        super();

        this.bg = null;
        this.bar = null;
        this.bgLen = 1;
        this.barLen = 0;

        this.tween = null;

        if (bgTex) {
            let p = bgTex.height / 2 - 1;
            this.bg = new PIXI.mesh.NineSlicePlane(bgTex, p, p, p, p);
            this.addChild(this.bg);
        }

        {
            let p = barTex.height / 2 - 1;
            this.bar = new PIXI.mesh.NineSlicePlane(barTex, p, p, p, p);
            this.addChild(this.bar);
        }

        this.on('removed', () => {
            this.tween && TWEEN.remove(this.tween);
            this.tween = null;       
        })
    }

    setLen(bgLen, barLen) {
        this.bgLen = bgLen || 1;
        this.barLen = barLen;
        this.bg && (this.bg.width = bgLen);
        this.bar.width = barLen;
    }

    /**
     * 更新滑动条显示
     * 基本原理: 假想列表显示区域为滑动条的滑动块, 列表实际内容为滑动条的背景条
     * 这里传递的是显示区域上边缘在 实际内容上的位置的比例
     */
    setPercent(t) {
        let w = this.barLen;
        if (t < 0) {
            w -= -(this.bgLen * t);
            w = Math.min(this.barLen, Math.max(this.bar.height, w));
            t = 0;
        } else if (t > 1 - this.barLen / this.bgLen) {
            w = (this.bgLen * (1 - t));
            w = Math.min(this.barLen, Math.max(this.bar.height, w));
            t = 1 - w / this.bgLen;
        }
        this.bar.width = w;
        this.bar.x = this.bgLen * t;
    }

    fadeIn() {
        this.tween && TWEEN.remove(this.tween);
        this.visible = true;
        this.tween = new TWEEN.Tween(this).to({
            alpha: 1
        }, 0.2).start();
    }

    fadeOut(delay = 0.01) {
        this.tween && TWEEN.remove(this.tween);
        this.visible = true;
        this.tween = new TWEEN.Tween(this).to({
            alpha: 0
        }, 0.2).delay(delay).onComplete(() => {
            this.visible = false;
        }).start();
    }
}
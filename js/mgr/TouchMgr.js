import * as PIXI from '../libs/pixi'

import Config from '../base/Config'

//触摸管理
export default class TouchMgr {
    constructor(stage, onTouchStart, onTouchEnd) {

        stage && (this._ui = this._createUi(stage));

        this.onTouchStart = onTouchStart;
        this.onTouchEnd = onTouchEnd;

        this._startFunc = this._onTouchStart.bind(this);
        this._endFunc = this._onTouchEnd.bind(this);
        this._cancelFunc = this._onTouchCancel.bind(this);
    }

    destroy() {
        this.setTouchEnable(false);
        this.onTouchStart = null;
        this.onTouchEnd = null;
        this._ui && this._ui.destroy({
            children: true
        });
        this._startFunc = null;
        this._endFunc = null;
        this._cancelFunc = null;
    }

    _createUi(stage) {
        let g = new PIXI.Graphics();
        g.interactive = true;

        g.beginFill(0, 0);
        g.drawRect(0, 0, Config.designWidth, Config.designHeight * 2 / 3);
        g.endFill();

        g.y = Config.designHeight * 1 / 3;
        stage.addChild(g);

        return g;
    }

    bindTouchStart() {
        if (this._ui) {
            this._ui.on('pointerdown', this._onTouchStart, this);
        } else {
            canvas.addEventListener('touchstart', this._startFunc, false);
        }
    }
    unbindTouchStart() {
        if (this._ui) {
            this._ui.off('pointerdown', this._onTouchStart, this);
        } else {
            canvas.removeEventListener('touchstart', this._startFunc, false);
        }
    }
    bindTouchEnd() {
        if (this._ui) {
            this._ui.on('pointerup', this._onTouchEnd, this);
            this._ui.on('pointercancel', this._onTouchEnd, this);
            this._ui.on('pointerout', this._onTouchEnd, this);
            this._ui.on('pointerupoutside', this._onTouchEnd, this);
        } else {
            canvas.addEventListener('touchend', this._endFunc, false);
            canvas.addEventListener('touchcancel', this._cancelFunc, false);
        }
    }
    unbindTouchEnd() {
        if (this._ui) {
            this._ui.off('pointerup', this._onTouchEnd, this);
            this._ui.off('pointercancel', this._onTouchEnd, this);
            this._ui.off('pointerout', this._onTouchEnd, this);
            this._ui.off('pointerupoutside', this._onTouchEnd, this);
        } else {
            canvas.removeEventListener('touchend', this._endFunc, false);
            canvas.removeEventListener('touchcancel', this._cancelFunc, false);
        }
    }

    setTouchEnable(enable) {
        if (enable) {
            this.bindTouchStart();
        } else {
            this.unbindTouchStart();
            this.unbindTouchEnd();

        }
    }

    _touchUp() {
        this.unbindTouchEnd();
    }

    _onTouchStart(e) {
        e && e.preventDefault && e.preventDefault();
        this.onTouchStart && this.onTouchStart(e);
        this.bindTouchEnd();
    }
    _onTouchEnd(e) {
        this._touchUp();
        this.onTouchEnd && this.onTouchEnd(e);
    }
    _onTouchCancel(e) {
        this._touchUp();
        this.onTouchEnd && this.onTouchEnd(e);
    }
}
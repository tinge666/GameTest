import * as PIXI from '../libs/pixi'
import DataBus from '../runtime/DataBus';
import SoundMgr from '../mgr/SoundMgr';

export default class Button extends PIXI.Sprite {
    constructor(texture) {
        super(texture);

        this.interactive = true;
        this.buttonMode = true;

        this._isSlipMode = false;

        this.anchor.set(.5, .5);

        this.zoom = .95;

        this._originTouchPos = new PIXI.Point(0, 0);

        this.on('pointerdown', this.onTapDown, this);
        this.on('pointerup', this.onTapUp, this);
        this.on('pointercancel', this.onTapUp, this);
        this.on('pointerout', this.onTapUp, this);
        this.on('pointerupoutside', this.onTapUp, this);

        this.on('removed', () => {
            this.off('pointerdown', this.onTapDown, this);
            this.off('pointerup', this.onTapUp, this);
            this.off('pointercancel', this.onTapUp, this);
            this.off('pointerout', this.onTapUp, this);
            this.off('pointerupoutside', this.onTapUp, this);
            this.off('pointermove', this.onTapMove, this);
        })
    }

    setSlideCancelTap(enabled) {
        if (enabled) {
            this.on('pointermove', this.onTapMove, this);
        } else {
            this.off('pointermove', this.onTapMove, this);
        }
    }

    onClick(func) {
        this.tap = ((e) => {
            if (this._isSlipMode) {
                return;
            }
            func && func(e);
            DataBus.soundEnabled && SoundMgr.instance.playEffect('click.mp3');
        });
    }

    onTapDown(e) {
        let pos = e.data.global;
        pos && this._originTouchPos.set(pos.x, pos.y);
        this._isSlipMode = false;

        this.scale.set(this.zoom, this.zoom);
    }
    onTapUp() {
        this.scale.set(1, 1);
    }
    onTapMove(e) {
        if (this._isSlipMode) {
            return;
        }
        let pos = e.data.global;
        if (pos) {
            let offsetX = pos.x - this._originTouchPos.x;
            let offsetY = pos.y - this._originTouchPos.y;
            if (offsetX * offsetX + offsetY * offsetY > 10 * 10) {
                this._isSlipMode = true;
                this.scale.set(1, 1);
            }
        }
    }
}

Button.makeButton = function (obj) {
    obj.interactive = true;
    obj.buttonMode = true;

    obj.anchor && obj.anchor.set(.5, .5);

    obj.on('pointerdown', onTapDown, obj);
    obj.on('pointerup', onTapUp, obj);
    obj.on('pointercancel', onTapUp, obj);
    obj.on('pointerout', onTapUp, obj);
    obj.on('pointerupoutside', onTapUp, obj);

    obj.on('removed', () => {
        obj.off('pointerdown', onTapDown, obj);
        obj.off('pointerup', onTapUp, obj);
        obj.off('pointercancel', onTapUp, obj);
        obj.off('pointerout', onTapUp, obj);
        obj.off('pointerupoutside', onTapUp, obj);
    })
    
    obj.zoom = .95;

    obj._originTouchPos = new PIXI.Point(0, 0);

    obj.setSlideCancelTap = function setSlideCancelTap(enabled) {
        if (enabled) {
            this.on('pointermove', onTapMove, this);
        } else {
            this.off('pointermove', onTapMove, this);
        }
    }

    obj.onClick = function onClick(func) {
        this.tap = ((e) => {
            if (this._isSlipMode) {
                return;
            }
            func && func(e);
            DataBus.soundEnabled && SoundMgr.instance.playEffect('click.mp3');
        });
    }

    function onTapDown(e) {
        let pos = e.data.global;
        pos && this._originTouchPos.set(pos.x, pos.y);
        this._isSlipMode = false;

        this.scale.set(this.zoom, this.zoom);
    }
    function onTapUp() {
        this.scale.set(1, 1);
    }
    function onTapMove(e) {
        if (this._isSlipMode) {
            return;
        }
        let pos = e.data.global;
        if (pos) {
            let offsetX = pos.x - this._originTouchPos.x;
            let offsetY = pos.y - this._originTouchPos.y;
            if (offsetX * offsetX + offsetY * offsetY > 10 * 10) {
                this._isSlipMode = true;
                this.scale.set(1, 1);
            }
        }
    }
}
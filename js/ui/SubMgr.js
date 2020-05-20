import * as PIXI from '../libs/pixi'
import SDK from '../libs/sdk'

import Config from '../base/Config'

let textures = {
    rank:null,
    result:null,
    group:null,
    beyond:null,
}

class SubParam {
    constructor(){
        this.name = null;
        this.w = 0;
        this.h = 0;
        this.msgObj = null;
        this.t = 20;
    }
    init(name, w, h, msgObj, t){
        this.name = name;
        this.w = w;
        this.h = h;
        this.msgObj = msgObj;
        this.t = t;
    }
    copy(obj){
        this.name = obj.name;
        this.w = obj.w;
        this.h = obj.h;
        this.msgObj = obj.msgObj;
        this.t = obj.t;
    }
}

export default class SubMgr{
    constructor(){

    }

    static getCanvas(){
        if(!this._canvas){
            if(wx.getOpenDataContext){
                this._canvas = wx.getOpenDataContext().canvas;
            }else {
                this._canvas = wx.createCanvas();
            }
        }
        return this._canvas;
    }

    static setCanvasSize(w, h){
        let cvs = this.getCanvas();
        // cvs.width = Math.ceil(SubMgr._dpr * w);
        // cvs.height = Math.ceil(SubMgr._dpr * h);
        cvs.width = Math.ceil(w)
        cvs.height = Math.ceil(h)
    }

    static getTexture(name){
        let tex = textures[name];
        if(!tex){
            tex = textures[name] = PIXI.Texture.fromCanvas(this.getCanvas(), PIXI.SCALE_MODES.LINEAR);
            // tex.baseTexture.resolution = SubMgr.resolution;
            tex.name = name
        }
        return tex;
    }

    static updateTexture(){
        if(this._curTex){
            this._curTex.update();
        }
    }

    static useTexture(name){
        if(!name){
            this._curTex = null;
        }else{
            this._curTex = this.getTexture(name);
        }
    }


    static sendMsg(msgObj){
        SDK.subMsg(msgObj);
    }

    static startUpdateTexture(t){
        clearInterval(this._updateTimer);
        this._updateTimer = setInterval(()=>{
            this.updateTexture();
        }, t || 20);
        this.updateTexture();
    }
    static stopUpdateTexture(){
        clearInterval(this._updateTimer);
        this._updateTimer = 0;
    }

    static switchToMode(name, w, h, msgObj, t){
        this._lastSubParam.init(name, w, h, msgObj, t);
        this.stopUpdateTexture();
        this.setCanvasSize(w || 7, h || 12);
        this.useTexture(name);
        // msgObj && (msgObj.dpr = SubMgr._dpr);
        msgObj && this.sendMsg(msgObj);
        name && this.startUpdateTexture(t);
    }

    static hideAll() {
        this.switchToMode(null, 0, 0, {msg:'hideAll', pauseUpdate: true} )
    }

    static closeAll(){
        this.switchToMode(null, 0, 0, {msg:'closeAll', pauseUpdate: true} )
    }

    static createSprite(name, w, h, msgOpen, msgClose, t, onRemoved){
        this.switchToMode(name, w, h, msgOpen, t);
        let sp = new PIXI.Sprite(this.getTexture(name));
        this.setSpriteEvent(sp, msgClose, onRemoved);
        return sp;
    }

    static setSpriteEvent(sp, msgClose, onRemoved) {
        sp.__onRemovedFunc && sp.off('removed', sp.__onRemovedFunc);
        sp.__onRemovedFunc = () => {
            this.switchToMode(null);
            msgClose && this.sendMsg(msgClose);
            onRemoved && onRemoved();
            sp.__onRemovedFunc = null;
        };
        sp.on('removed', sp.__onRemovedFunc);
    }

    static getLastParam(){
        return this._lastSubParam;
    }

    static switchToParam(p){
        this.switchToMode(p.name, p.w, p.h, p.msgObj, p.t);
    }

}

SubMgr._canvas = null;
SubMgr._curTex = null;
SubMgr._updateTimer = 0;

SubMgr.SubParam = SubParam;
SubMgr._lastSubParam = new SubParam();

// SubMgr._dpr = 1.5
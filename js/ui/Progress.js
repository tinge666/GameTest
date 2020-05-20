import * as PIXI from '../libs/pixi'

export default class Progress extends PIXI.Container {
    constructor(bgTex, fgTex, width) {
        super();

        this.w = width || bgTex.width;
        this.h = bgTex.height;

        let p = bgTex.height / 2 - 1;
        this.bg = new PIXI.mesh.NineSlicePlane(bgTex, p, p, p, p);
        this.bg.width = this.w;
        this.addChild(this.bg);

        p = fgTex.height / 2 - 1;
        this.bar = new PIXI.mesh.NineSlicePlane(fgTex, p, p, p, p);
        this.addChild(this.bar);

        this.setPercent(0);
    }

    set percent(t) {
        this._percent = t;
        this.bar.width = this.w * t;
    }
    get percent() {
        return this._percent;
    }

    setPercent(t){
        this._percent = t;
        this.bar.width = this.w * t;
    }
    getPercent(){
        return this._percent;
    }

}
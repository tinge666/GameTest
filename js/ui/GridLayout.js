
import * as PIXI from '../libs/pixi'

/**
 * 网格对齐容器
 */
export default class GridLayout extends PIXI.Container {
    /**
     * 
     * @param {*} w 容器宽
     * @param {*} h 行高
     * @param {*} r 每行元素数量
     * @param {*} d 方向
     */
    constructor(w, h, r, d = GridLayout.Direction.Vertical) {
        super();

        this.w = w;
        this.h = h;
        this.r = r;
        this.d = d;
    }

    refresh(){
        let x = (this.d == GridLayout.Direction.Vertical) ? 'x' : 'y';
        let y = (this.d == GridLayout.Direction.Vertical) ? 'y' : 'x';
        let marginX = this.w / this.r;
        this.children.forEach((child, i) => {
            child[x] = marginX * (i % this.r + 0.5);
            child[y] = this.h * (Math.floor(i / this.r) + 0.5);
        });
    }
}

GridLayout.Direction = {
    Vertical: 0,
    Horizontal: 1,
}
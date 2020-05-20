
import * as PIXI from '../libs/pixi'

/**
 * 行列表容器
 * 在视野内复用列表项
 */
export default class ListLayout extends PIXI.Container {
    /**
     * 
     * @param {*} vh 视野高
     * @param {*} rh 行高
     * @param {*} data 数据源
     * @param {*} len 数据长度
     * @param {*} modelCreator 项创建函数
     * @param {*} onUpdate 刷新函数
     */
    constructor(vh, rh, data, len, modelCreator, onUpdate) {
        super();

        this._vh = vh;
        this._rh = rh;
        this._data = data;
        this._dataLen = len;
        this._modelCreator = modelCreator;
        this._onUpdate = onUpdate;
        this._firstIndex = -1e8;

        this._visibleModelMap = new Map();
        this._modelList = [];
        this._modelCount = Math.ceil(vh / rh) + 1;
        if(modelCreator) {
            for(let i = 0; i < this._modelCount; ++i) {
                let item = modelCreator();
                item.visible = false;
                this._modelList.push(item);
                this._visibleModelMap.set(this._firstIndex + i, item);
                this.addChild(item);
            }
        }

        this.on('removed', () => {
            this._visibleModelMap.clear();
            this._modelList.length = 0;
            this._data = null;
            this._modelCreator = null;
            this._onUpdate = null;
        })
    }

    setData(data, dataLen) {
        this._data = data;
        this._dataLen = dataLen;
        this.refresh();
    }

    get y() {
        return super.y;
    }
    set y(y) {
        // let dir = y - super.y;
        super.y = y;
        this.refresh();
    }

    refresh(){
        if(this._data && this._dataLen > 0) {
            let first = this._getFirstIndex();
            for(let i = 0; i < this._modelCount; ++i) {
                let index = i + first;
                if(!this._visibleModelMap.has(index)) {
                    let item = null;
                    let oldIndex = -1;
                    if(Math.abs(first - this._firstIndex) > this._modelCount) {
                        oldIndex = i + this._firstIndex;
                    } else {
                        oldIndex = (first - this._firstIndex < 0) ? index + this._modelCount : index - this._modelCount;
                    }
                    if(this._visibleModelMap.has(oldIndex)) {
                        item = this._visibleModelMap.get(oldIndex);
                        this._visibleModelMap.delete(oldIndex);
                    }
                    if(item) {
                        let visible = index >= 0 && index < this._dataLen;
                        this._visibleModelMap.set(index, item);
                        item.visible = visible;
                        item.y = this._rh * index;
                        visible && this._onUpdate && this._onUpdate(item, index, this._data);
                    }
                }
            }
            this._firstIndex = first;
        }
    }

    _getFirstIndex() {
        return Math.floor(-this.y / this._rh);
    }
}
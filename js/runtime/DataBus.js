import SDK from '../libs/sdk'
import promisify from '../libs/Promisify';

import Utils from '../base/Utils'
import Config from '../base/Config';

let GameStatus = {
    Main: 0,
    Running: 1,
    Pause: 2,
    Revive: 3,
    Result: 4,
}


export default class DataBus {
    constructor() {}

    /**
     * 基础存取
     */
    static saveData(key, obj) {
        let str = JSON.stringify(obj);
        wx.setStorage({
            key: key,
            data: str,
            success: res => {
                console.log('DataBus.saveData(' + key + ') 成功: ', res);
            },
            fail: error => {
                console.warn('DataBus.saveData(' + key + ') 出错: ', error);
            }
        })
    }
    static readData(key) {
        let str = wx.getStorageSync(key);
        if (str !== '') {
            try {
                return JSON.parse(str);
            } catch (error) {
                console.warn('DataBus.readData(' + key + ') 出错: ', error);
                return null;
            }
        }
        return null;
    }
    static readDataAsync(key) {
        return promisify(wx.getStorage, {
            key: key,
        }).then(res => {
            let str = res.data;
            try {
                return Promise.resolve(JSON.parse(str));
            } catch (error) {
                console.warn('DataBus.readDataAsync(' + key + ') 出错: ', error);
                return Promise.reject(error);
            }
        });
    }


    /**
     * 注册需要保存的成员变量
     * @param {*} group 保存到的分组名
     * @param {*} name 变量名
     * @param {*} value 变量默认值
     * @param {*} abbr 变量缩写
     */
    static reg(group, name, value, abbr) {

        let Group = null;
        if (group) {
            abbr = abbr || name;
            Group = this.Group[group];
            if (!Group) {
                Group = this.Group[group] = {
                    name: group,
                    data: {},
                    dirty: false,
                };
            }
            if (Group.data[abbr] != undefined) {
                console.warn(`DataBus.reg 重复注册变量: ${group}[${abbr}]`);
            }
            Group.data[abbr] = name;
        }

        let alias = '__' + name;
        if (this[alias] != undefined) {
            console.warn(`DataBus.def 重复定义变量: Databus.${name}`);
        }

        Object.defineProperty(this, name, {
            get: () => {
                return this[alias] != undefined ? this[alias] : (typeof value == 'function' ? value() : value);
            },
            set: v => {
                if (v == undefined || (Array.isArray(value) && !Array.isArray(v))) {
                    v = (typeof value == 'function' ? value() : value);
                }
                if (this[alias] != v) {
                    this[alias] = v;
                    Group && (Group.dirty = true);
                    
                    //监听数组更改, 无法监听length的设置
                    if (Array.isArray(v)) {
                        [
                            'push',
                            'pop',
                            'shift',
                            'unshift',
                            'splice',
                            'sort',
                            'reverse'
                        ].forEach(method => {
                            v[method] = function () {
                                Group && (Group.dirty = true);
                                return Array.prototype[method].apply(v, arguments);
                            }
                        })
                    }
                }
            },
        });
    }

    static getGroupByVar(varName) {
        for (let group in this.Group) {
            let Group = this.Group[group];
            if (Group.data) {
                for (let abbr in Group.data) {
                    if (Group.data[abbr] == varName) {
                        return Group;
                    }
                }
            }
        }
        return null;
    }

    static setVarDirty(varName) {
        let Group = this.getGroupByVar(varName);
        Group && (Group.dirty = true);
    }


    /**
     * 通过数据变量保存分组, 适用于无法监听到的数据对象属性改变
     */
    static saveVar(varName) {
        this.setVarDirty(varName);
        this.saveAllData();
    }


    /**
     * 保存所有有变更的数据
     * @param {*} force 强制保存所有数据
     */
    static saveAllData(force) {
        for (let group in this.Group) {
            let Group = this.Group[group];
            if (Group.dirty || force) {
                let obj = {};
                for (let d in Group.data) {
                    obj[d] = this[Group.data[d]];
                }
                this.saveData(group, obj);
                Group.dirty = false;
            }
        }
    }

    /**
     * 同步读取所有数据
     */
    static readAllData() {
        for (let group in this.Group) {
            let Group = this.Group[group];
            let obj = this.readData(group) || {};
            for (let d in Group.data) {
                this[Group.data[d]] = obj[d];
            }
            Group.dirty = false;
        }
    }

    /**
     * 异步读取所有数据
     */
    static readAllDataAsync() {
        let arr = [];
        for (let group in this.Group) {
            let Group = this.Group[group];
            let func = obj => {
                for (let d in Group.data) {
                    this[Group.data[d]] = obj[d];
                }
                return Promise.resolve();
            }
            arr.push(this.readDataAsync(group).then(obj => {
                return func(obj);
            }).catch(err => {
                return func({});
            }));
            Group.dirty = false;
        }
        return Promise.all(arr);
    }



    /**
     * 一般交互
     */
    static updateScore() {
        if (this.score > this.best) {
            this.newRecord = true;
            this.best = this.score;
        } else {
            this.newRecord = false;
        }
    }
    static submitScore() {
        let score = this.best;
        let rankData = {
            "wxgame": {
                "score": score,
                "update_time": Math.floor(new Date().getTime() / 1000)
            }
        };
        SDK.updateScore({
            score: score,
            bscore: JSON.stringify(rankData)
        });
    }
    static get isNewUser() {
        return this._isNewUser;
    }


    static clearReceiveList() {
        for (let i = DataBus.receiveItemList.length - 1; i > 0; --i) {
            let o = DataBus.receiveItemList[i];
            if (Utils.getInterval(o.t) > Config.itemShareTimeout) {
                DataBus.receiveItemList.splice(i, 1);
            }
        }
    }

    static _isToday(ts) {
        return new Date(ts).toDateString() == new Date().toDateString();
    }
    static checkGroupTimestamp() {
        if (!this._isToday(this.groupTimestamp)) {
            this.gidList = [];
        }
    }
    static checkShareTimestamp() {
        if (!this._isToday(this.shareTimestamp)) {
            // this.shareTimes = 0;
            this.shareList = [];
        }
    }

}

//保存分组
DataBus.Group = {};


//主要用户数据(用户ID, 成绩, 获得精灵列表, 获赠礼物列表, 底座数量记录, 关卡记录)
DataBus.reg('user_data', 'uuid', Utils.generateUUID.bind(Utils), 'uu');
DataBus.reg('user_data', 'best', 0, 'be');
DataBus.reg('user_data', 'petList', [], 'pt');
DataBus.reg('user_data', 'giftList', [], 'gl');
DataBus.reg('user_data', 'platformRecord', 0, 'pr');
DataBus.reg('user_data', 'levelRecord', -1, 'lr');

//音量/振动配置
DataBus.reg('Config', 'soundEnabled', true, 'se');
DataBus.reg('Config', 'vibrateEnabled', true, 've');

//领取的道具列表(用于提示道具已领取过)/分享过的群列表/最后分享群的时间戳/分享次数/最后分享的时间戳
DataBus.reg('share', 'receiveItemList', [], 'ri');
DataBus.reg('share', 'reviveItem', 0, 'rc');
DataBus.reg('share', 'rulerItem', 0, 'ru');
DataBus.reg('share', 'gidList', [], 'l');
DataBus.reg('share', 'groupTimestamp', 0, 'gt');
// DataBus.reg('share', 'shareTimes', 0, 'st'); //分享统计必为点进来时统计, 需要去重复, 所以从次数改为分享ID列表
DataBus.reg('share', 'shareList', [], 'sl')
DataBus.reg('share', 'shareTimestamp', 0, 'sts');

//点击了的内推app_id列表
DataBus.reg('ad2', 'ad2List', [], 'al');

//下载文件列表/已下载模型的版本
DataBus.reg('dfl', 'downloadFileMap', {}, 'dl');
DataBus.reg('dfl', 'modelDownloadVersion', 0, 'md');


/**
 * 不需要保存的数据
 */

//新用户
DataBus._isNewUser = !!((DataBus.readData('isNewUser') || {}).value);
if (DataBus._isNewUser) {
    DataBus.saveData('isNewUser', {
        value: false
    });
}

//新的记录
DataBus.newRecord = false;

//当前连环
DataBus.combo = 0;

//当前分数
DataBus.score = 0;


//此局复活次数
DataBus.reviveTimes = 0;

//游戏状态
DataBus.gameStatus = GameStatus.Main;

//使用尺子
DataBus.rulerTimes = 0;

//点了道具分享时的时间戳
DataBus.shareItemTimestamp = 0;


/**
 * 类型, 读取及挂载
 */

//游戏状态类型
DataBus.GameStatus = GameStatus;



//挂载
window.DataBus = DataBus;
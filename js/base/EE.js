
import * as PIXI from '../libs/pixi'

let ee = {};

/**
 * 事件监听发送
 * 用例:
 *  1. 添加监听 EE.on('test', func, node), 重复添加只响应最后一次
 *  2. 移除监听 EE.off('test', node)移除target为node的test监听, EE.off('test')移除所有test监听, EE.off(null, node)移除target为node的所有监听
 *  3. 发送事件 EE.emit('test)
 * 注意事项:
 *  1. pixi对象remove时自动清除监听
 *  2. 相同的对象,相同的事件, 后面的监听 会覆盖 以前的监听
 *  3. 重复添加监听不会产生多余的pixi remove事件监听
 *  4. 移除监听的操作与监听时的fn函数无关
 *  5. 注意, 如EE.on('test', func)会添加test监听, 其target为undefined, 此监听无法单独移除, 因为EE.off('test', undefined)会删除所有test监听
 */
let EE = {
    on(event, fn, target) {
        if(!fn) {
            return;
        }
        if(!ee[event]) {
            ee[event] = new Map();
        }
        let eee = ee[event];
        let eeet = eee.get(target);
        if(eeet) {
            eeet.offRemove && eeet.offRemove();
        }
        let offFn = () => {
            this.off(event, target);
        }
        let offRemove = () => {
            target && target.off && target.off('removed', offFn)
        }
        target && target.on && target.on('removed', offFn);
        eee.set(target, {
            event: event,
            target: target,
            fn: fn,
            offRemove: offRemove,
        })
    },

    off(event, target) {
        if(event && target) {
            let eee = ee[event];
            if(eee) {
                eee.forEach(eeet => {
                    eeet.offRemove && eeet.offRemove();
                });
                delete ee[event];
            }
        } else if(event && target) {
            let eee = ee[event];
            if(eee) {
                let eeet = eee.get(target);
                if(eeet) {
                    eeet.offRemove && eeet.offRemove();
                    eee.delete(target);
                }
                if(eee.size == 0) {
                    delete ee[event];
                }
            }
        } else if(!event && target) {
            for(let e in ee) {
                let eee = ee[e];
                eee.forEach((eeet, t) => {
                    if(t == target) {
                        eeet.offRemove && eeet.offRemove();
                        eee.delete(t);
                    }
                })
            }
        }
    },

    offAll() {
        for(let e in ee) {
            this.off(e);
        }
    },

    emit(event) {
        let eee = ee[event];
        if(eee) {
            eee.forEach(eeet => {
                eeet.fn && eeet.fn();
            })
        }
    },
}

export default EE;
window.EE = EE;
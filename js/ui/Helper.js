import * as PIXI from '../libs/pixi'
import TWEEN from '../libs/tween'

import Config from '../base/Config'
import Utils from '../base/Utils'
import {Pool2D} from '../base/Pool'

import Button from '../ui/Button'
import RankLayer from '../ui/RankLayer'

import DataBus from '../runtime/DataBus'

import SoundMgr from '../mgr/SoundMgr';
import EE from '../base/EE';

import '../libs/RichText';
import Ubb from '../libs/Ubb';

// let starPool = new Pool2D();

export default class Helper{
    constructor(){

    }

    static _addTweenRemoveFunc(node, name, tween) {
        let tweenName = '__' + name + '_tween';
        let funcName = '__' + name + '_remove_func';
        node[tweenName] && TWEEN.remove(node[tweenName]);
        node[tweenName] = tween;
        node[funcName] && node.off('removed', node[funcName]);
        node[funcName] = () => {
            node[tweenName] && TWEEN.remove(node[tweenName]);
            node[tweenName] = null;
            node[funcName] = null;
        }
        node.on('removed', node[funcName]);
    }

    static fadeTo(node, from, to, duration, delay, ease, callback) {
        node.alpha = from;
        let tween = new TWEEN.Tween(node).to({
            alpha: to
        }, duration).easing(ease ? ease : TWEEN.Easing.Linear.None)
        .delay(delay || 0).onComplete(() => {
            callback && callback();
        }).start();
        this._addTweenRemoveFunc(node, 'fade', tween);
    }
    
    static scaleTo(node, from, to, duration, delay, ease, callback) {
        node.scale.set(from, from);
        let tween = new TWEEN.Tween(node.scale).to({
            x: to,
            y: to,
        }, duration).easing(ease ? ease : TWEEN.Easing.Linear.None)
        .delay(delay || 0).onComplete(() => {
            callback && callback();
        }).start();
        this._addTweenRemoveFunc(node, 'scale', tween);
    }

    static moveTo(node, from, to, duration, delay, ease, callback) {
        node.x = from.x;
        node.y = from.y;
        let tween = new TWEEN.Tween(node).to({
            x: to.x,
            y: to.y,
        }, duration).easing(ease ? ease : TWEEN.Easing.Linear.None)
        .delay(delay || 0).onComplete(() => {
            callback && callback();
        }).start();
        this._addTweenRemoveFunc(node, 'move', tween);
    }

    static rotateForever(node, duration) {
        node.rotation = 0;
        let tween = new TWEEN.Tween(node).to({
            rotation: Math.PI * 2,
        }, duration).repeat(Infinity).start();
        this._addTweenRemoveFunc(node, 'rotation', tween);
    }

    
    static createMask (alpha = 0.5, func = null) {
        let g = new PIXI.Graphics();
    
        g.width = Config.vWidth;
        g.height = Config.vHeight;
        g.interactive = true;
        g.tap = func;
    
        g.beginFill(0x000000, alpha);
        g.drawRect(0, 0, Config.vWidth, Config.vHeight);
        g.endFill();
    
        return g;
    }

    static createBackground(tex, alpha = 1, func = null) {
        let bg = new PIXI.Sprite(tex);
        bg.width = Config.vWidth;
        bg.height = Config.vHeight;
        bg.interactive = true;
        bg.tap = func;
        bg.alpha = alpha;
        
        return bg;
    }

    static colorMultiply (color, t){
        return (Math.floor((color >> 16) * t) << 16)
            + (Math.floor((color >> 8 & 0xff) * t) << 8)
            + Math.floor((color & 0xff) * t)
    }
    
    static createLabel (str, size = 36, color = 0xffffff) {
        return new PIXI.Text(str, {
            fontSize: size,
            fill: color,
            align: 'center',
        });
    }

    static createMuiltLabel(str, size, color, lineHeight, width) {
        return new PIXI.Text(str, {
            fontSize: size,
            lineHeight: lineHeight,
            fill: color,
            align: 'center',
            // textBaseline: 'middle',
            wordWrap: true,
            wordWrapWidth: width,
        });
    }

    static setLabelAlignCenter (lbl) {
        lbl.style.align = 'center';
        lbl.style.textBaseline = 'alphabetic';
        lbl.anchor.set(.5, .5);
    }
    
    static setLabelAdaptSize (lbl, w, h) {
        if(lbl && lbl.texture) {
            let func = () => {
                let lw = lbl.width;
                let lh = lbl.height;
                if(lw <= 0 || lh <= 0) {
                    return;
                }
                let scale = Math.min(w / lw, h / lh, 1);
                lbl.scale.set(scale, scale);
            }
            let baseTexture = lbl.texture.baseTexture;
            // if (baseTexture.hasLoaded) {
            //     func();
            // } else 
            {
                baseTexture.once('update', func);
            }
        }
    }

    static createRichText(str, size, color, w, h) {
        let arr = Ubb.parse(str);
        console.log('解析UBB字符串: ', arr);
        var richText = new PIXI.extras.RichText();
        richText.setWordWrap(true);
        richText.width = w;
        richText.height = h;
        arr.forEach((o, i) => {
            let re = null;
            if(o.k == 'color' && o.v) {
                let color1 = parseInt(o.v.replace('#', '0x'));
                if(Number.isNaN(color1)) {
                    color1 = color;
                }
                re = new PIXI.extras.RichElementText(i, color1, 1, o.s, '', size);
            } else if (o.k == 'size' && o.v) {
                let size1 = parseInt(o.v) || size;
                re = new PIXI.extras.RichElementText(i, color, 1, o.s, '', size1);
            } else {
                re = new PIXI.extras.RichElementText(i, color, 1, o.s, '', size);
            }
            richText.pushBackElement(re);
        })
        return richText;
    }
    
    static createImageButton (tex, x = 0, y = 0, func = null) {
        let btn = new Button(tex);
        btn.onClick(func);
        btn.x = x;
        btn.y = y;
        return btn;
    }
    
    static createTextButton (str, x = 0, y = 0, func = null, size = 36, color = 0xffffff) {
        let btn = new PIXI.Text(str, {
            fontSize: size,
            lineHeight: (size < 60) ? 70 : size + 10,
            fill: color,
            align: 'center',
        });
        this.setLabelAlignCenter(btn);
        Button.makeButton(btn);
        btn.onClick(func);
        btn.x = x;
        btn.y = y;
        return btn;
    }

    static createButton(param = { bg:null, tex:null, nine:false, x:0, y:0, func:null }){
        if(!param.bg && !param.tex){
            return null;
        }
        let tex = param.bg ? (param.bg) : (param.tex);
        let sub_tex = param.bg && param.tex ? (param.tex) : null;
        let btn;
        if(param.nine){
            let p = tex.height / 2 - 1;
            btn = new PIXI.mesh.NineSlicePlane(tex, p, p, p, p);
        }else{
            btn = new PIXI.Sprite(tex);
        }
        if(sub_tex){
            let sp = new PIXI.Sprite(sub_tex);
            sp.anchor.set(.5, .5);
            btn.addChild(sp);
            btn.sp = sp;
        }

        Button.makeButton(btn);
        btn.onClick(param.func || null);
        btn.x = param.x || 0;
        btn.y = param.y || 0;

        return btn;
    }
    
    static createRowBtns (width, arr) {
        let pnl = new PIXI.Container();
        pnl.name = 'row_btns_pnl';

        let btnsWidth = 0;
        arr.forEach((o, i)=>{
            let btn = this.createButton(o);
            o.name && (btn.name = o.name);
            pnl.addChild(btn);

            o.init && o.init(btn);

            btnsWidth += btn.width;
        });

        let margin = (width - btnsWidth) / (arr.length - 1);
        let x = -width / 2;
        pnl.children.forEach((btn, i) => {
            x += btn.width / 2;
            btn.x = x;
            x += btn.width / 2 + margin;
        })

        return pnl;
    }
    
    static createRect (w, h, color, alpha, round = 0){
        let g = new PIXI.Graphics();
        g.interactive = true;
    
        g.beginFill(color, alpha);
        round <= 0 ? g.drawRect(0, 0, w, h) : g.drawRoundedRect(0, 0, w, h, round);
        // g.drawRoundedRect(0, 0, w, h, round || 0);
        g.endFill();
    
        return g;
    }

    static createCircle(radius, color){
        let g = new PIXI.Graphics();
        g.interactive = true;
    
        g.beginFill(color, 1);
        g.drawCircle(0, 0, radius);
        g.endFill();
    
        return g;
    }

    static showToast(text, duration = 2, parent = null){
        let pnl = new PIXI.Container();
        pnl.x = Config.vWidth / 2;
        pnl.y = Config.vHeight / 2;
        if(!parent){
            parent = window.main && window.main.app && window.main.app.stage;
        }
        parent && parent.addChild(pnl);

        let w = 550;
        
        let lbl = this.createMuiltLabel(text, 32, 0xffffff, 50, w * 0.8);
        this.setLabelAlignCenter(lbl);

        let h = lbl.height + 50;

        let bg = this.createRect(w, h, 0x000000, 0.5, 16);
        bg.x = -w / 2;
        bg.y = -h / 2;

        pnl.addChild(bg);
        pnl.addChild(lbl);

        pnl.scale.y = 0;
        let t1 = new TWEEN.Tween(pnl.scale).to({
            y:[1.2, 1],
        }, 0.3);
        let t2 = new TWEEN.Tween(pnl.scale).to({
            x:[1, 1, 1, 0],
            y:0,
        }, 0.3).delay(duration).onComplete(() => {
            pnl.destroy();
            TWEEN.remove(t1);
            TWEEN.remove(t2);
        });
        t1.chain(t2).start();

        return pnl;
    }

    
    static _showDialog(name, w, h, title, close = null, mask = true, maskAlpha = 0.5, parent = null) {

        SoundMgr.instance.playEffect('popout.mp3');

        let dialogName = name + 'Dialog';
        if (window[dialogName]) {
            window[dialogName].destroy({
                children: true
            });
        }

        //根节点
        let root = new PIXI.Container();
        root.name = dialogName;
        if (!parent) {
            parent = window.main && window.main.app && window.main.app.stage;
        }
        parent && parent.addChild(root);
        window[dialogName] = root;

        //关闭时调用
        let closeFunc = () => {
            close && close();
            root.destroy({
                children: true
            });
        };
        root.__closeFunc = closeFunc;

        //半透明遮罩
        let bg = this.createMask(maskAlpha, mask ? null : closeFunc);
        root.addChild(bg);
        this.fadeTo(bg, 0, 1, 1);
        root.__mask = bg;

        //居中节点
        let pnl = new PIXI.Container();
        pnl.x = Config.vWidth * .5;
        pnl.y = Config.vHeight * .5;
        root.addChild(pnl);
        this.scaleTo(pnl, 0.01, 1, 0.5, 0, TWEEN.Easing.Elastic.Out);
        root.__pnl = pnl;

        //弹框
        {
            // let sp = this.createRect(w, h, 0x000000, 0.8, 0);
            let sp = new PIXI.mesh.NineSlicePlane(Utils.texDialog('box.png'), 10, 10, 10, 10);
            sp.interactive = true;
            sp.width = w;
            sp.height = h;
            sp.x = -w * .5;
            sp.y = -h * .5;
            pnl.addChild(sp);
            root.__dialog = sp;
        }

        //标题
        if (title) {
            let sp = new PIXI.Sprite(title);
            sp.anchor.set(.5, 0);
            sp.y = -h * .5 + 25;
            pnl.addChild(sp);
            root.__title = sp;
        }

        //关闭按钮
        {
            let btn = this.createButton({
                tex: Utils.texDialog('btn_close.png'),
                x: w / 2 - 40,
                y: -h / 2 + 40,
                func: closeFunc,
            });
            pnl.addChild(btn);
            root.__close = btn;
        }

        return root;
    }

    static showSettingDialog(onSoundChange = null, onVibrateChange = null, maskAlpha = 0.5, parent = null) {

        let soundEnabled = DataBus.soundEnabled;
        let vibrateEnabled = DataBus.vibrateEnabled;

        let w = 448,
            h = 328;
        let root = this._showDialog('Setting', w, h, Utils.texDialog('title_setting.png'), () => {
            if (soundEnabled != DataBus.soundEnabled || vibrateEnabled != DataBus.vibrateEnabled) {
                DataBus.saveAllData();
            }
        }, false, maskAlpha, parent);

        let pnl = root.__pnl;

        //声音按钮
        let btnSound = this.createButton({
            tex: Utils.texDialog('btn_sound_on.png'),
            x: -w / 2 + 124,
            y: -h / 2 + 192,
        });
        pnl.addChild(btnSound);
        let updateSound = () => {
            let file = DataBus.soundEnabled ? 'btn_sound_on.png' : 'btn_sound_off.png';
            let tex = Utils.texDialog(file);
            btnSound.texture = tex;
        }
        updateSound();
        btnSound.onClick(() => {
            DataBus.soundEnabled = !DataBus.soundEnabled;
            onSoundChange && onSoundChange();
            updateSound();
        })

        //振动按钮
        let btnVibrate = this.createButton({
            tex: Utils.texDialog('btn_vibrate_on.png'),
            x: -w / 2 + 315,
            y: -h / 2 + 192,
        });
        pnl.addChild(btnVibrate);
        let updateVibrate = () => {
            let file = DataBus.vibrateEnabled ? 'btn_vibrate_on.png' : 'btn_vibrate_off.png';
            let tex = Utils.texDialog(file);
            btnVibrate.texture = tex;
        }
        updateVibrate();
        btnVibrate.onClick(() => {
            DataBus.vibrateEnabled = !DataBus.vibrateEnabled;
            onVibrateChange && onVibrateChange();
            updateVibrate();
        })
    }

    /**
     * 
     * @param {*} w 弹窗宽
     * @param {*} h 弹窗高
     * @param {*} pnl 容器
     * @param {string} lbl1 标签1
     * @param {string} lbl2 标签2
     * @param {string} lbl3 标签3
     * @param {*} pic 道具材质
     * @param {boolean} light 显示光效
     * @param {*} status 分享/视频
     * @param {*} texUse 使用按钮的材质
     * @param {function} onGot 获取成功回调
     * @param {function} onUse 获取失败回调
     */
    static _createItemDialogUi(w, h, pnl, lbl1, lbl2, lbl3, pic, light, status, texUse, onGot, onUse) {
        
        let arr = [];
        if(light) {
            let sp = new PIXI.Sprite(Utils.texDialog('light0.png'));
            sp.scale.set(2, 2);
            arr.push(sp);
            sp = new PIXI.Sprite(Utils.texDialog('light1.png'));
            sp.scale.set(2, 2);
            arr.push(sp);
            this.rotateForever(sp, 5);
        }

        if(pic) {
            let sp = new PIXI.Sprite(pic);
            arr.push(sp);
        }

        arr.forEach(sp => {
            sp.anchor.set(.5, .5);
            sp.y = -h * .085;
            pnl.addChild(sp);
        })

        let createLbl = (name, str, size, color, y) => {
            let lbl = this.createLabel(str, size, color);
            Helper.setLabelAlignCenter(lbl);
            lbl.y = -h * .5 + y;
            pnl.addChild(lbl);
            pnl[name] = lbl;
            return lbl;
        }
        createLbl('__lbl1', lbl1, 32, 0xffc946, 112);
        createLbl('__lbl2', lbl2, 32, 0xffffff, h - 250);
        // createLbl('__lbl3', lbl3, 24, 0xffffff, 478);
        
        let rtW = w * .75, rtH = 52;
        let rt = Helper.createRichText(lbl3, 24, 0xffffff, rtW, rtH);
        rt.x = -rtW * .5;
        rt.y = -h * .5 - rtH + h - 192;
        pnl.addChild(rt);
        pnl.__lbl3 = rt;

        let tex = (status == Utils.ShareVideoRet.Share) ?
            Utils.texDialog('btn_free_get.png') :
            Utils.texDialog('btn_video_get.png');
        let btnGot = Helper.createButton({
            y: h * .5 -78,
            tex: tex,
            func: onGot,
        });
        pnl.addChild(btnGot);

        if(onUse) {
            let btnUse = Helper.createButton({
                x: 120,
                y: h * .5 -78,
                tex: texUse,
                func: onUse,
            });
            pnl.addChild(btnUse);

            btnGot.x = -116;
        } else {
            btnGot.x = 0;
        }
    }
    
    // 显示尺子道具弹窗
    static showRulerItemDialog(status, onUse, onClose, maskAlpha = 0.5, parent = null) {
        let w = 520,
            h = 830;

        //创建弹窗
        let root = this._showDialog('RulerItem', w, h, Utils.texDialog('title_ruler.png'), onClose, true, maskAlpha, parent);
        let pnl = root.__pnl;

        //相关数据
        let max = parseInt(SDK.ruler_max) || Config.maxItemCount;
        let inc = parseInt(SDK.ruler_inc) || 1;

        let shareStr = SDK.item_share_str != undefined ? SDK.item_share_str : '分享到不同群, 自已点击链接, 可以立即获得{0}个';
        let str = status == Utils.ShareVideoRet.Share ? shareStr : '看完视频后, 可以立即获得{0}个';
        str = str.replace('{0}', inc);

        let closeFunc = root.__closeFunc;
        
        //创建弹窗上UI
        Helper._createItemDialogUi(
            w, h, pnl,
            `当前拥有 (${DataBus.rulerItem} / ${max})`,
            '使用后出现尺子助你完美过关',
            str,
            // Utils.texDialog('item_ruler.png'),
            Utils.texDialog('ruler_sample.png'),
            false, status,
            Utils.texDialog('btn_use.png'),
            () => {
                //是分享时设置一个变量, 短时间内后台返回, 弹框提示用户
                if(status == Utils.ShareVideoRet.Share) {
                    DataBus.shareItemTimestamp = new Date().getTime();
                }
                Utils.shareOrVideo(status, Utils.SharePos.ItemRuler, res => {
                    if(status == Utils.ShareVideoRet.Video) {
                        DataBus.rulerItem = Math.min(max, DataBus.rulerItem + inc);
                        DataBus.saveAllData();
                        Helper.showToast(`恭喜你获得了${inc}个过关神器!`);
                        EE.emit('update_ruler_number');
                    }
                }, err => {
                    if (typeof err == 'string') {
                        Helper.showToast(err);
                    }
                })
            },
            onUse ? () => {
                if(DataBus.rulerItem > 0) {
                    DataBus.rulerItem = DataBus.rulerItem - 1;
                    DataBus.rulerTimes = parseInt(SDK.ruler_max_number) || 3;
                    DataBus.saveAllData();
                    EE.emit('update_ruler_number');
                    closeFunc();
                    onUse();
                } else {
                    Helper.showToast('道具数量不够哦!');
                }
            } : null,
        )

        //监听数量变化
        EE.on('update_ruler_number', () => {
            pnl.__lbl1.text =  `当前拥有 (${DataBus.rulerItem} / ${max})`;
        }, pnl.__lbl1)

        return root;
    }

    // 显示复活道具弹窗
    static showReviveItemDialog(status, onUse, onClose, maskAlpha = 0.5, parent = null) {
        let w = 520,
            h = 671;
        
        //创建弹窗
        let root = this._showDialog('ReviveItem', w, h, Utils.texDialog('title_revive.png'), onClose, true, maskAlpha, parent);
        let pnl = root.__pnl;

        //相关数据
        let max = parseInt(SDK.revive_item_max) || Config.maxItemCount;
        let inc = parseInt(SDK.revive_item_inc) || 1;

        let shareStr = SDK.item_share_str != undefined ? SDK.item_share_str : '分享到不同群, 自已点击链接, 可以立即获得{0}个';
        let str = status == Utils.ShareVideoRet.Share ? shareStr : '看完视频后, 可以立即获得{0}个';
        str = str.replace('{0}', inc);

        let closeFunc = root.__closeFunc;

        //创建弹窗上UI
        Helper._createItemDialogUi(
            w, h, pnl,
            `当前拥有 (${DataBus.reviveItem} / ${max})`,
            '使用后立即复活',
            str,
            Utils.texDialog('item_revive.png'),
            true, status,
            Utils.texDialog('btn_use.png'),
            () => {
                //是分享时设置一个变量, 短时间内后台返回, 弹框提示用户
                if(status == Utils.ShareVideoRet.Share) {
                    DataBus.shareItemTimestamp = new Date().getTime();
                }
                Utils.shareOrVideo(status, Utils.SharePos.ItemRevive, res => {
                    if(status == Utils.ShareVideoRet.Video) {
                        DataBus.reviveItem = Math.min(max, DataBus.reviveItem + inc);
                        DataBus.saveAllData();
                        Helper.showToast(`恭喜你获得了${inc}个复活币!`);
                        EE.emit('update_revive_item_number');
                    }
                }, err => {
                    if (typeof err == 'string') {
                        Helper.showToast(err);
                    }
                })
            },
            onUse ? () => {
                if(DataBus.reviveItem > 0) {
                    DataBus.reviveItem = DataBus.reviveItem - 1;
                    DataBus.saveAllData();
                    EE.emit('update_revive_item_number');
                    closeFunc();
                    onUse();
                } else {
                    Helper.showToast('道具数量不够哦!');
                }
            } : null,
        )

        //监听数量变化
        EE.on('update_revive_item_number', () => {
            pnl.__lbl1.text =  `当前拥有 (${DataBus.reviveItem} / ${max})`;
        }, pnl.__lbl1)

        return root;
    }

    static showRankLayer(type, ticket, onRemoved = null, parent = null) {
        if(!parent){
            parent = window.main && window.main.app && window.main.app.stage;
        }
        let layer = new RankLayer(type, ticket, onRemoved);
        parent.addChild(layer);
    }

    static loadImage(url, callback) {
        let tex = PIXI.Texture.fromImage(url);
        let base = tex.baseTexture;
        if(callback) {
            base.hasLoaded ? callback(tex) : base.once('loaded', () => {
                callback(tex);
            });
        }
        return tex;
    }
    
    static createUserInfoBtn(left, top, width, height, successFunc, failFunc) {
        
        let r = Config.sHeight / Config.vHeight
        left = left * r;
        top = top * r;
        width = width * r;
        height = height * r;

        let btn = window.wx.createUserInfoButton({
            type: 'text',
            text: ' ',
            style: {
                left: left,
                top: top,
                width: width,
                height: height,
                backgroundColor: '#00000001',
                color: '#00000001',
                fontSize: 1,
            },
            withCredentials: true,
            lang: 'zh_CN',
        });
        btn.onTap((res) => {
            console.log('使用UserInfoButton获取用户信息: ', res);
            if (res.errMsg.indexOf('fail') > -1 || res.errMsg.indexOf('auth deny') > -1 || res.errMsg.indexOf('auth denied') > -1) {
                console.log('使用UserInfoButton获取用户信息, 授权失败!')
                failFunc && failFunc(res);
            }else{
                console.log('使用UserInfoButton获取用户信息, 授权成功!')
                successFunc && successFunc(res);
            }
        });
        return btn;
    }

    static showTips(str, func, parent = null) {

        let w = 520,
            h = 390;
        
        //创建弹窗
        let root = this._showDialog('Tips', w, h, Utils.texDialog('title_tips.png'), func, true, 0.5, parent);
        let pnl = root.__pnl;
        let closeFunc = root.__closeFunc;

        let rtW = w * .8, rtH = 70;
        let rt = Helper.createRichText(str, 28, 0xffffff, rtW, rtH);
        rt.x = -rtW * .5;
        rt.y = -rtH - 20;
        pnl.addChild(rt);

        let btnOk = this.createButton({
            tex: Utils.texDialog('btn_ok.png'),
            x: 0,
            y: h * .5 - 78,
            func: closeFunc,
        });
        pnl.addChild(btnOk);

        return root;
    }

    // static createStarPnl(){
    //     let pnl = new PIXI.Container();

    //     let rndMove = star => {
    //         let duration = Utils.rnd_float(5, 10);
    //         let delay = Utils.rnd_float(0.1, 0.6);
    //         let x = Math.random() * Config.vWidth;
    //         let y = Math.random() * Config.vWidth;
    //         let a = Math.random() * Math.PI * 2;
    //         star.position.set(x, y);
    //         star.rotation = a;
    //         star.alpha = 0;
    //         star.scale.set(0, 0);
    //         star.t1 && TWEEN.remove(star.t1);
    //         star.t2 && TWEEN.remove(star.t2);
    //         let t1 = new TWEEN.Tween(star).to({
    //             x: x + Utils.rnd_minus1_1() * 20,
    //             y: x + Utils.rnd_minus1_1() * 20,
    //             rotation: Math.random() * Math.PI * 2,
    //             alpha: [1, 0],
    //         }, duration).delay(delay).start();
    //         let t2 = new TWEEN.Tween(star.scale).to({
    //             x: [1, 0],
    //             y: [1, 0],
    //         }, duration).delay(delay).onComplete(()=>{
    //             rndMove(star);
    //         }).start();
    //         star.t1 = t1;
    //         star.t2 = t2;
    //     }
        
    //     for(let i = 0; i < 10; ++i){
    //         let star = starPool.get();
    //         pnl.addChild(star);

    //         rndMove(star);
    //         star.on('removed', () => {
    //             star.t1 && TWEEN.remove(star.t1);
    //             star.t2 && TWEEN.remove(star.t2);
    //             star.t1 = null;
    //             star.t2 = null;
    //         });
    //     }

    //     return pnl;
    // }

}

window.Helper = Helper;

// let starTexIndex = 0;
// let starTextures = ['star1.png', 'star2.png'];
// starPool.createFunc = () => {
//     ++starTexIndex;
//     return new PIXI.Sprite(Utils.tex(starTextures[starTexIndex % 2]));
// }

//此时材质尚未加载好, 无法提前预创建池缓存
// for(let i = 0; i < 10; ++i){
//     starPool.put(starPool.createFunc());
// }
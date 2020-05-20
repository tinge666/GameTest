import * as PIXI from '../libs/pixi'
import TWEEN from '../libs/tween.js'
import SDK from '../libs/sdk'

import Utils from '../base/Utils'
import Config from '../base/Config'

import SubMgr from '../ui/SubMgr'
import Helper from '../ui/Helper.js';
import FeedbackBtn from '../ui/FeedbackBtn.js';
import ListView from '../ui/ListView'
import ListLayout from '../ui/ListLayout'

import DataBus from '../runtime/DataBus';


let RankType = {
    Friends : 0,
    Group: 1
}

export default class RankLayer extends PIXI.Container {
    constructor(type = RankType.Friends, ticket = '', onRemoved = null) {
        super();

        this.w = Config.vWidth;
        this.h = Config.vHeight;

        this._type = type;
        this._ticket = ticket;

        this._onRemoved = onRemoved;

        this._subW = 462;
        this._subH = 720;
        this._subX = 130;
        this._subY = 240;

        this._frameTime = 16.67;

        this._msgName = (this._type == RankType.Group) ? 'group' : 'rank';
        this._msgOpen = {
            msg: this._msgName,
            action: 'show',
            ticket: this._ticket,
            pageMode: false,
            startUpdate: true,
            resolution: [Math.ceil(this._subX), Math.ceil(this._subY + (this.h - 1280) / 2), Math.ceil(this.w), Math.ceil(this.h)]
        };
        this._msgClose = {
            msg: this._msgName,
            action: 'hide',
            pauseUpdate: true,
            resolution: null
        };

        this.initUi();

        FeedbackBtn.changeMask(1);

        this.removed = false;
        this.on('removed', () => {
            this.removed = true;
            FeedbackBtn.changeMask(-1);
            SDK.hideLoading();
            this._wxBtn && this._wxBtn.destroy();
        })
    }

    initUi() {

        //背景
        let bg = Helper.createBackground(Utils.texBg('bg.jpg'), 0.5);        
        this.addChild(bg);
        // let t1 = new TWEEN.Tween(bg).to({alpha:1}, 0.5).start();
        // bg.on('removed', () => TWEEN.remove(t1));
        Helper.fadeTo(bg, 0, 1, 0.5);

        //容器, 用于将所有元素置于720*1280空间内
        let root = new PIXI.Container();
        root.x = 0;
        root.y = (this.h - 1280) / 2;
        this.addChild(root);
        this._root = root;

        //上方两按钮背景
        let tabBar = new PIXI.Sprite(Utils.texRank('tab1.png'));
        tabBar.anchor.set(.5, 0);
        tabBar.x = this.w / 2;
        tabBar.y = 150;
        root.addChild(tabBar);
        this._tabBar = tabBar;

        //上方两按钮
        let png = (this._type == RankType.Group) ? ('group_rank.png') : ('friends_rank.png');
        let btn1 = Helper.createImageButton(Utils.texRank(png));
        btn1.x = this.w * .5 - btn1.width * .5;
        btn1.y = 150 + btn1.height * .5;
        root.addChild(btn1);
        this._btnFriends = btn1;
        
        let btn2 = Helper.createImageButton(Utils.texRank('world_rank.png'));
        btn2.x = this.w * .5 + btn1.width * .5;
        btn2.y = 150 + btn1.height * .5;
        root.addChild(btn2);

        btn1.onClick(() => {
            this.showFriendsRank();
        })
        btn2.onClick(() => {
            this.showWorldRank();
        })

        //创建用户信息按钮
        this.addUserInfoBtn(root.x + btn2.x - btn2.width * btn2.anchor.x,
            root.y + btn2.y - btn2.height * btn2.anchor.y,
            btn2.width, btn2.height);

        //窗口背景
        let box = new PIXI.mesh.NineSlicePlane(Utils.texRank('rank_box.png'), 16, 1, 16, 16);
        box.width = 508;
        box.height = 602;
        box.x = (720 - 508) / 2;
        box.y = tabBar.y + tabBar.height;
        root.addChild(box);

        //自已成绩背景
        let selfBg = new PIXI.Sprite(Utils.texRank('mine_back.png'));
        selfBg.anchor.set(.5, 0);
        selfBg.x = this.w / 2;
        selfBg.y = box.y + box.height + 24;
        root.addChild(selfBg);

        //查看群排行按钮
        if(this._type == RankType.Friends) {
            let btnGroup = Helper.createButton({
                tex: Utils.texRank('btn_group.png'),
                x: this.w / 2,
                y: 1034,
                func:() => {
                    this.onGroupClick();
                }
            });
            root.addChild(btnGroup);
        }

        //关闭按钮
        let btnClose = Helper.createButton({
            tex: Utils.texRank('rank_close.png'),
            x: 600,
            // y: 70 + (Config.isIPhoneX ? 40 : 0),
            y: 150 - 40,
            func: () => {
                this.destroy({children: true});
            }
        });
        root.addChild(btnClose);

        //数据域
        if(this._type == RankType.Friends) {
            this.showFriendsRank();
        } else {
            this.showGroupRank();
        }
    }

    getWorldPnl() {
        if(!this._world) {
            let pnl = new PIXI.Container();
            pnl.x = this._subX;
            pnl.y = this._subY;
            this._root.addChild(pnl);

            let lv = new ListView(this._subW, this._subH - 120);
            lv.useMask = true;
            lv.direction = ListView.Direction.Vertical;
            pnl.addChild(lv);
            this._lv = lv;

            //列表内容
            // let content = new PIXI.Container();
            let content = new ListLayout(this._subH - 120, 88, null, 0, () => {
                return this.createRankItem();
            }, (item, i, data) => {
                if(item && i >= 0 && data) {
                    let d = data.list ? data.list[i] : null;
                    d && this.updateRankItem(item, d.rank, d.avatar, d.name, d.score, true);
                }
            })
            lv.setContent(content);

            this._content = content;

            //自已的定位
            let self = new PIXI.Container();
            self.y = this._subH - 88;
            pnl.addChild(self);
            this._self = self;

            this._world = pnl;
        }
        return this._world;
    }

    showLocalRank(name) {
        this._tabBar.texture = Utils.texRank('tab1.png');        
        if(!this._sub) {
            let sub = SubMgr.createSprite(this._msgName, this._subW, this._subH,
                this._msgOpen, this._msgClose, this._frameTime, this._onRemoved);
           sub.position.set(this._subX, this._subY);
           this._root.addChild(sub);
           this._sub = sub;
        } else {
            this._sub.visible = true;
            this._msgName = name;
            this._msgOpen.msg = this._msgName;
            this._msgClose.msg = this._msgName;
            this._msgOpen.ticket = this._ticket;
            SubMgr.switchToMode(this._msgName, this._subW, this._subH, this._msgOpen, this._frameTime);
            SubMgr.setSpriteEvent(this._sub, this._msgClose, this._onRemoved);
        }
        if(this._world) {
            this._world.visible = false;
        }
    }

    showFriendsRank() {
        this._btnFriends.texture = Utils.texRank('friends_rank.png');
        this.showLocalRank('rank');
    }

    showGroupRank() {
        this._btnFriends.texture = Utils.texRank('group_rank.png');
        this.showLocalRank('group');
    }

    showWorldRank() {
        this._tabBar.texture = Utils.texRank('tab2.png');
        let world = this.getWorldPnl();
        world.visible = true;
        //隐藏子域精灵
        this._sub.visible = false;
        //隐藏子域
        //不再刷新子域材质
        SubMgr.hideAll();
    }

    onGroupClick(){
        SDK.pullCfg = false; //不需要重新拉取广告

        Utils.share(Utils.SharePos.Group, null, (res) => {
            console.log('群排行分享回调', res);
            if (res.shareTickets) {

                this._ticket = res.shareTickets[0];
                this.showGroupRank();
                
            } else {
                Helper.showToast('需要分享到群，才能查看群排行榜哦！');
            }
        }, (res) => {

        });
    }

    addWorldRank(list, self) {
        // this._content.removeChildren();
        // list.forEach((data, i) => {
        //     let item = this.createRankItem(i + 1, data.avatar, data.name, data.score, 460, 88, true);
        //     item.y = i * 88;
        //     this._content.addChild(item);
        // });
        // //PIXI计算的RECT尺寸不对, 可能是场景缩放的原因, 这里手动计算尺寸
        // this._lv.setContentHeight(88 * list.length);

        // this._self.removeChildren();
        // let index = list.findIndex(v => v.avatar == self.avatarUrl)
        // if(index != -1) {
        //     let data = list[index];
        //     let item = this.createRankItem(index + 1, data.avatar, data.name, data.score, 460, 88, false);
        //     this._self.addChild(item);
        // }

        let len = list.length;
        this._content.setData({
            list:list
        }, len);
        this._lv.setContentHeight(88 * len);

        let selfItem = this._self.children[0];
        if(!self) {
            selfItem && (selfItem.visible = false);
        } else {
            if(!selfItem) {
                selfItem = this.createRankItem();
                this._self.addChild(selfItem);
            }
            selfItem.visible = true;
            this.updateRankItem(selfItem, self.rank, self.avatar, self.name, self.score, false);
        }
    }

    addUserInfoBtn(x, y, w, h) {
        
        this._wxBtn = Helper.createUserInfoBtn(
            x, y, w, h, res => {
                // let self = res.userInfo;
                SDK.showLoading('加载中...');
                console.log('授权成功, 先提交成绩, 再获取成绩');
                Utils.submitLeaderboard(DataBus.best).then(res => {
                    console.log('提交成绩到世界榜成功: ', res);
                    Utils.getLeaderboard().then(res => {
                        console.log('获取世界榜成功: ', res);
                        SDK.hideLoading();
                        let list = res.data.data.list;
                        let mine = res.data.data.mine;
                        if(this && !this.removed) {
                            this._wxBtn.hide();
                            this.showWorldRank();
                            this.addWorldRank(list, mine);
                        }
                    }).catch(res => {
                        console.log('获取世界榜失败了: ', res);
                        Helper.showToast('获取世界排行榜失败了!');
                        SDK.hideLoading();
                    });
                }).catch(res => {
                    console.log('提交成绩到世界排行榜失败了: ', res);
                    Helper.showToast('提交成绩到世界排行榜失败了!');
                    SDK.hideLoading();
                });
            }, res => {
                console.log('世界榜用户信息按钮授权失败: ', res);
                Helper.showToast('需要您的授权哦!');
            }
        )
    }

    createRankItem(w = 460, h = 88) {
        let root = new PIXI.Container()

        //背景
        {
            let bg = new PIXI.Sprite(Utils.texRank('split.png'))
            bg.width = w
            bg.y = h - bg.height
            root.addChild(bg)
            root.__bg = bg;
        }

        //名次
        // if(rank <= 3 && rank >= 1) 
        {
            let sp = new PIXI.Sprite()
            sp.anchor.set(.5, .5)
            sp.x = 33
            sp.y = h * .5
            root.addChild(sp)
            root.__rankBg = sp;
        }
        // else 
        {
            let lbl = Helper.createLabel('', 30, 0x5e5e5e)
            lbl.style.fontWeight = 'bold'
            lbl.x = 33
            lbl.y = h * .5
            Helper.setLabelAlignCenter(lbl)
            root.addChild(lbl)
            root.__rank = lbl;
        }

        //头像
        {
            let sp = new PIXI.Sprite()
            sp.anchor.set(.5, .5)
            sp.width = sp.height = 70
            sp.x = 117
            sp.y = h * .5
            root.addChild(sp)
            root.__icon = sp;
        }

        //昵称
        {
            let lbl = Helper.createLabel('', 26, 0x6a6a6a)
            lbl.x = 258
            lbl.y = h * .5
            Helper.setLabelAlignCenter(lbl)
            root.addChild(lbl)
            root.__name = lbl;
        }

        //分数
        {
            let lbl = Helper.createLabel('', 20, 0xdf467e)
            lbl.anchor.set(1, .5)
            lbl.style.align = 'right'
            lbl.x = 452
            lbl.y = h * .5
            root.addChild(lbl)
            root.__score = lbl;
        }

        return root
    }

    updateRankItem(item, rank, icon, nick, score, showBg = true) {
        item.__bg.visible = showBg;

        if(rank <= 3 && rank >= 1) {
            item.__rankBg.visible = true;
            item.__rankBg.texture = Utils.texRank('rank' + rank + '.png');
            item.__rank.visible = false;
        } else {
            item.__rankBg.visible = false;
            item.__rank.visible = true;
            item.__rank.text = rank + '';
        }

        let sp = item.__icon;
        sp.texture = Utils.texRank('icon_default.png');
        Helper.loadImage(icon, tex => {
            sp.texture = tex;
            sp.width = sp.height = 70
        });

        let lblName = item.__name;
        lblName.text = nick;
        Helper.setLabelAdaptSize(lblName, 150, 50);

        let lblScore = item.__score;
        lblScore.text = score;
        Helper.setLabelAdaptSize(lblScore, 85, 50);
    }

    // createRankItem(rank, icon, nick, score, w = 460, h = 88, showBg = true) {

    //     let root = new PIXI.Container()

    //     //背景
    //     if(showBg) {
    //         let bg = new PIXI.Sprite(Utils.texRank('split.png'))
    //         bg.width = w
    //         bg.y = h - bg.height
    //         root.addChild(bg)
    //     }

    //     //名次
    //     if(rank <= 3 && rank >= 1) {
    //         let sp = new PIXI.Sprite(Utils.texRank('rank' + rank + '.png'))
    //         sp.anchor.set(.5, .5)
    //         sp.x = 33
    //         sp.y = h * .5
    //         root.addChild(sp)
    //     } else {
    //         let lbl = Helper.createLabel(rank + '', 30, 0xffffff)
    //         lbl.style.fontWeight = 'bold'
    //         lbl.x = 33
    //         lbl.y = h * .5
    //         Helper.setLabelAlignCenter(lbl)
    //         if (rank <= 3 && rank >= 1) {
    //             lbl.tint = 0xf2ea27
    //         }else{
    //             lbl.tint = 0x5e5e5e
    //         }
    //         root.addChild(lbl)
    //     }

    //     //头像
    //     let sp = new PIXI.Sprite()
    //     sp.anchor.set(.5, .5)
    //     sp.width = sp.height = 70
    //     sp.x = 117
    //     sp.y = h * .5
    //     sp.texture = Helper.loadImage(icon, tex => {
    //         sp.width = sp.height = 70
    //     });
    //     root.addChild(sp)

    //     //昵称
    //     let lbl = Helper.createLabel(nick, 26, 0xffffff)
    //     lbl.x = 258
    //     lbl.y = h * .5
    //     Helper.setLabelAlignCenter(lbl)
    //     Helper.setLabelAdaptSize(lbl, 150, 50)
    //     lbl.tint = 0x6a6a6a
    //     root.addChild(lbl)

    //     //分数
    //     lbl = Helper.createLabel(score, 20, 0xffffff)
    //     lbl.anchor.set(1, .5)
    //     lbl.style.align = 'right'
    //     lbl.x = 452
    //     lbl.y = h * .5
    //     Helper.setLabelAdaptSize(lbl, 85, 50)
    //     lbl.tint = 0xdf467e
    //     root.addChild(lbl)
        
    //     return root
    // }

}

RankLayer.RankType = RankType;

RankLayer.globalName = 'RankLayer';

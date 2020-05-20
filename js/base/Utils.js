import * as PIXI from '../libs/pixi'

import SDK from '../libs/sdk'

import DataBus from '../runtime/DataBus'
import Config from './Config.js';

import promisify from '../libs/Promisify.js'
import { utils } from '../libs/pixi';

export default class Utils {

    static rnd_minus1_1() {
        return Math.random() * 2 - 1;
    }

    /**
     * 返回[a, b]范围随机整数
     * @param {*} a 整数
     * @param {*} b 整数
     */
    static rnd_int(a, b) {
        return Math.floor(Math.random() * (b - a + 1) + a);
    }

    /**
     * 返回[a, b)范围随机浮点数
     * @param {*} a 
     * @param {*} b 
     */
    static rnd_float(a, b) {
        return Math.random() * (b - a) + a;
    }

    /**
     * 随机选取一项返回
     * @param {*} n 
     */
    static rnd_pick(...n) {
        return n[Math.floor(Math.random() * n.length)];
    }

    /**
     * 如果两个时间戳是同一天, 则返回true, 否则返回false
     * @param {*} ts1 时间戳, 可以由(new Date()).getTime()得到
     * @param {*} ts2 时间戳, 省略则计算为现在
     */
    static isSameDay(ts1, ts2) {
        ts2 = (ts2 == undefined) ? (new Date()).getTime() : ts2;
        //星期不同, 肯定不是同一天
        if ((new Date(ts1)).getDay() != (new Date(ts2)).getDay()) {
            return false;
        }
        //星期相同, 差值小于一天, 则为同一天
        return (Math.abs(ts1 - ts2) <= 86400000);
    }

    /**
     * 获取时间间隔(小时)
     * @param {*} ts1 时间戳, 可以由(new Date()).getTime()得到
     * @param {*} ts2 时间戳, 省略则计算为现在
     */
    static getInterval(ts1, ts2) {
        ts2 = (ts2 == undefined) ? (new Date()).getTime() : ts2;
        return Math.abs(ts1 - ts2) / 3600000;
    }

    static loadAllTextures(callback) {

        var arr = [];

        //背景图
        {
            arr.push(...[
                'res/ui/unpack/bg.jpg',
                'res/ui/unpack/bg0.png',
                'res/ui/unpack/bg1.png',
                'res/ui/unpack/bg2.png',
            ])
        }
        
        // //商店UI
        // {
        //     arr.push(...[
        //         'res/ui/pack/shop/btn_back.png',
        //         'res/ui/pack/shop/btn_battle.png',
        //         'res/ui/pack/shop/btn_friend.png',
        //         'res/ui/pack/shop/dialog.png',
        //         'res/ui/pack/shop/lock.png',
        //         'res/ui/pack/shop/music1.png',
        //         'res/ui/pack/shop/music2.png',
        //         'res/ui/pack/shop/progress1.png',
        //         'res/ui/pack/shop/progress2.png',
        //         'res/ui/pack/shop/selected.png',
        //         'res/ui/pack/shop/solved.png',
        //         'res/ui/pack/shop/title.png',
        //         'res/ui/pack/shop/unlock.png',
        //     ])
        // }

        // //主页
        // {
        //     arr.push(...[
        //         'res/ui/pack/main/btn_pet.png',
        //         'res/ui/pack/main/btn_rank.png',
        //         'res/ui/pack/main/btn_revive.png',
        //         'res/ui/pack/main/btn_ruler.png',
        //         'res/ui/pack/main/btn_setting.png',
        //         'res/ui/pack/main/btn_share.png',
        //         'res/ui/pack/main/btn_start.png',
        //     ]);
        // }


        // //对话框
        // {
        //     arr.push(...[
        //         'res/ui/pack/dialog/box.png',
        //         'res/ui/pack/dialog/btn_close.png',
        //         'res/ui/pack/dialog/btn_free_get.png',
        //         'res/ui/pack/dialog/btn_ok.png',
        //         'res/ui/pack/dialog/btn_revive.png',
        //         'res/ui/pack/dialog/btn_sound_off.png',
        //         'res/ui/pack/dialog/btn_sound_on.png',
        //         'res/ui/pack/dialog/btn_use.png',
        //         'res/ui/pack/dialog/btn_vibrate_off.png',
        //         'res/ui/pack/dialog/btn_vibrate_on.png',
        //         'res/ui/pack/dialog/btn_video_get.png',
        //         'res/ui/pack/dialog/item_revive.png',
        //         'res/ui/pack/dialog/item_ruler.png',
        //         'res/ui/pack/dialog/light0.png',
        //         'res/ui/pack/dialog/light1.png',
        //         'res/ui/pack/dialog/title_revive.png',
        //         'res/ui/pack/dialog/title_ruler.png',
        //         'res/ui/pack/dialog/title_setting.png',
        //         'res/ui/pack/dialog/title_tips.png',
        //         'res/ui/pack/dialog/btn_ruler_free.png',
        //         'res/ui/pack/dialog/btn_ruler_video.png',
        //         'res/ui/pack/dialog/ruler_sample.png',
        //     ])
        // }


        // //复活
        // {
        //     arr.push(...[
        //         'res/ui/pack/revive/btn_free_revive.png',
        //         'res/ui/pack/revive/btn_revive.png',
        //         'res/ui/pack/revive/btn_revive_item.png',
        //         'res/ui/pack/revive/circle.png',
        //     ])
        // }

        // //结果
        // {
        //     arr.push(...[
        //         'res/ui/pack/result/btn_battle.png',
        //         'res/ui/pack/result/btn_full_rank.png',
        //         'res/ui/pack/result/btn_home.png',
        //         'res/ui/pack/result/btn_retry.png',
        //         'res/ui/pack/result/result_banner.png',
        //         'res/ui/pack/result/result_item_border.png',
        //         'res/ui/pack/result/result_score.png',
        //     ])
        // }

        // //游戏界面
        // {
        //     arr.push(...[
        //         'res/ui/pack/game/btn_music.png',
        //         'res/ui/pack/game/btn_present.png',
        //         'res/ui/pack/game/pet_box.png',
        //         'res/ui/pack/game/tips0.png',
        //         'res/ui/pack/game/tips1_bg.png',
        //         'res/ui/pack/game/tips1.png',
        //         'res/ui/pack/game/tips2_bg.png',
        //         'res/ui/pack/game/tips2.png',
        //         'res/ui/pack/game/tips3_bg.png',
        //         'res/ui/pack/game/tips3.png',
        //         'res/ui/pack/game/tutorial1.png',
        //         'res/ui/pack/game/tutorial2.png',
        //     ]);
        // }

        // //排行榜
        // {
        //     arr.push(...[
        //         'res/ui/pack/rank/btn_group.png',
        //         'res/ui/pack/rank/friends_rank.png',
        //         'res/ui/pack/rank/group_rank.png',
        //         'res/ui/pack/rank/icon_default.png',
        //         'res/ui/pack/rank/mine_back.png',
        //         'res/ui/pack/rank/rank1.png',
        //         'res/ui/pack/rank/rank2.png',
        //         'res/ui/pack/rank/rank3.png',
        //         'res/ui/pack/rank/rank_box.png',
        //         'res/ui/pack/rank/rank_close.png',
        //         'res/ui/pack/rank/rank_scroll_bar.png',
        //         'res/ui/pack/rank/split.png',
        //         'res/ui/pack/rank/tab1.png',
        //         'res/ui/pack/rank/tab2.png',
        //         'res/ui/pack/rank/world_rank.png',
        //     ]);
        // }

        // //宠物缩略图
        // {
        //     arr.push(...[
        //         'res/ui/pack/pet/cat.png',
        //         'res/ui/pack/pet/cow.png',
        //         'res/ui/pack/pet/dog.png',
        //         'res/ui/pack/pet/duck.png',
        //         'res/ui/pack/pet/fox.png',
        //         'res/ui/pack/pet/giraffe.png',
        //         'res/ui/pack/pet/lion.png',
        //         'res/ui/pack/pet/monkey.png',
        //         'res/ui/pack/pet/owl.png',
        //         'res/ui/pack/pet/panda.png',
        //         'res/ui/pack/pet/pig.png',
        //         'res/ui/pack/pet/rabbit.png',
        //     ]);
        // }

        // //内推
        // {
        //     arr.push(...[
        //         'res/ui/pack/ad2/arrow.png',
        //         'res/ui/pack/ad2/bg.png',
        //         'res/ui/pack/ad2/btn.png',
        //         'res/ui/pack/ad2/kuang.png',
        //         'res/ui/pack/ad2/red.png',
        //         'res/ui/pack/ad2/red1.png',
        //         'res/ui/pack/ad2/singleColor.png',
        //         'res/ui/pack/ad2/title.png',
        //     ])
        // }

        PIXI.loader.add(arr).load(() => {
            let fsm = wx.getFileSystemManager();
            let json = JSON.parse(fsm.readFileSync('res/ui/altas.json', "utf8"));
            let png = PIXI.BaseTexture.fromImage('res/ui/altas.png');
            let onLoaded = () => {
                let sheet = new PIXI.Spritesheet(png, json);
                console.log('合图图片加载完成, 创建sheet:', sheet);
                sheet.parse((res) => {
                    Utils.sheet = sheet;
                    console.log('合图sheet parse完成:', res);
                    callback && callback(sheet);
                })
            }
            console.log('合图数据:', json);
            console.log('合图图片:', png);
            png.hasLoaded ? onLoaded() : png.once('loaded', onLoaded);

            // callback && callback();
        });
    }

    // static tex(key) {
    //     // let tex = PIXI.Texture.fromImage('res/ui/' + key);
    //     // let tex = PIXI.loader.resources['res/ui/' + key].texture;
    //     // let tex = PIXI.loader.resources['res/res.json'].textures[key];

    //     // let tex = Utils.sheet.textures[key];
    //     // return tex;

    //     let tex = PIXI.loader.resources['res/ui/game/' + key].texture;
    //     return tex;
    // }

    static texBg(key) {
        let tex = PIXI.loader.resources['res/ui/unpack/' + key].texture;
        return tex;
    }

    static texLoading(key) {
        let tex = PIXI.loader.resources['res/ui/loading/' + key].texture;
        return tex;
    }

    static texPack(type, key) {
        // let tex = PIXI.loader.resources['res/ui/pack/' + type + '/' + key].texture;
        let tex = Utils.sheet.textures[type + '/' + key];
        return tex;
    }

    static texShop(key) {
        return Utils.texPack('shop', key);
    }

    static texMain(key) {
        return Utils.texPack('main', key);

    }

    static texDialog(key) {
        return Utils.texPack('dialog', key);
    }

    static texRevive(key) {
        return Utils.texPack('revive', key);
    }

    static texResult(key) {
        return Utils.texPack('result', key);
    }

    static texGame(key) {
        return Utils.texPack('game', key);
    }

    static texRank(key) {
        return Utils.texPack('rank', key);
    }

    static texPet(key) {
        return Utils.texPack('pet', key + '.png');
    }

    static texAd2(key) {
        return Utils.texPack('ad2', key);
    }


    static model(key) {
        // return wx.env.USER_DATA_PATH + '/model/' + key;
        // return 'res/tex/model/' + key + '.bin';
        // return 'https://imgcache.xiaoyouxiqun.com/game_general/bridge01/' + Config.modelVersion + '/model/' + key + '.bin';
        return 'model/' + key + '.bin';
    }


    static vibrateShort() {
        DataBus.vibrateEnabled &&
            window.wx && typeof wx.vibrateShort == 'function' && wx.vibrateShort();
    }
    static vibrateLong() {
        DataBus.vibrateEnabled &&
            window.wx && typeof wx.vibrateLong == 'function' && wx.vibrateLong();
    }


    static getShareConfig(pos) {
        //从分享位置序号(整数)获得分享位置名(字符串)
        let name = Utils.SharePos[pos];
        //获取分享query对象
        let queryObj = Utils.LocalShare.getQuery(name);

        //分享标题, 图片, 分享配置的ID
        let title, pic, share_id;
        //获取在线分享配置
        let shareConfig = SDK.getShareConfig(pos);
        //使用在线分享配置
        if (shareConfig) {
            title = shareConfig.share_text;
            pic = shareConfig.share_pic_local;
            share_id = shareConfig.share_id;
        }
        //使用本地分享配置
        else {
            title = Utils.LocalShare.getRandTitle(name);
            pic = Utils.LocalShare.getRandPic(name);
            share_id = -1;
        }

        //query添加分享位置及分享配置的ID, 用于统计
        queryObj.position_id = pos;
        queryObj.share_id = share_id;

        return {
            title: title,
            pic: pic,
            query: queryObj,
        };
    }

    static share(pos, query, success, fail) {

        //清空不是今天产生的分享记录
        DataBus.checkShareTimestamp();

        let c = this.getShareConfig(pos);

        if(query) {
            for (let i in query) {
                c.query[i] = query[i];
            }
        }
        let queryStr = Utils.generateQuery(c.query);

        //分享
        SDK.share(c.title, c.pic, queryStr, res => {
            
            //分享不再回调无法统计次数, 取消这里的统计, 放在点分享进来的地方
            // DataBus.shareTimes = (parseInt(DataBus.shareTimes) || 0) + 1;
            // DataBus.shareTimestamp = new Date().getTime();
            // DataBus.saveAllData();

            console.log('分享回调不响应');
            // success && success(res);
        }, fail);
    }

    static shareToGroup(pos, query, success, fail) {
        this.share(pos, query, res => {
            let shareTicket = (res && res.shareTickets) ? res.shareTickets[0] : null;
            this.checkShareTicket(shareTicket, success, fail);
        }, fail);
    }

    static checkShareTicket(shareTicket, success, fail) {
        if (!shareTicket) {
            fail && fail(SDK.toperson_tips);
        } else {
            //要求分享到不同群
            if (this.needDifferentGroup()) {
                //获取群ID
                this.getGroupId(shareTicket).then(gid => {
                    console.log('获取GID成功: ', gid);
                    //检查群分享
                    this.isGroupShareValid(gid).then(times => {
                        //次数够或者是新群
                        success && success();
                    }).catch(times => {
                        //群分享到不同群次数不够
                        fail && fail(SDK.tosamegroup_tips);
                    })
                }).catch(err => {
                    //获取群ID失败 //算用户成功分享
                    console.log('获取GID失败, 算用户分享成功: ', err);
                    success && success();
                })
            } else {
                //不需要分享到不同的群
                success && success();
            }
        }
    }

    //TODO 群分享是否需要分享到不同的群
    static needDifferentGroup() {
        return (SDK.diff_group_cnt || 0) > 0;
    }

    //TODO 还需要分享到不同的群几次
    static getDifferentGroupRemainTimes() {
        return (SDK.diff_group_cnt || 0) - DataBus.gidList.length;
    }

    // 群分享是否有效
    static isGroupShareValid(gid) {

        //清理不是今天产生的群分享记录
        DataBus.checkGroupTimestamp();
        console.log('[isGroupShareValid]当前分享记录: ', DataBus.gidList);

        //是新的群
        let isNewGid = (DataBus.gidList.indexOf(gid) == -1);
        if (isNewGid) {
            DataBus.gidList.push(gid);
            DataBus.groupTimestamp = new Date().getTime();
            console.log('[isGroupShareValid]分享是新的群, 添加到记录.');
            DataBus.saveAllData();
        }

        //剩余不同群任务次数
        let times = this.getDifferentGroupRemainTimes();

        //任务完成了, 或者 这次分享是新的群
        if (times <= 0 || isNewGid) {
            console.log(`[isGroupShareValid]'不同'任务完成:(${DataBus.gidList.length} / ${SDK.diff_group_cnt}) 或是新的群分享:(${isNewGid}), 综上, 这次群分享有效!`);
            return Promise.resolve(times);
        }

        console.log(`[isGroupShareValid]'不同'任务未完成(${DataBus.gidList.length} / ${SDK.diff_group_cnt}), 并且此次是重复分享`);
        return Promise.reject(times);

    }

    static getGroupId(shareTicket) {
        return promisify(wx.login).then(res => {
            let code = res.code;

            return promisify(wx.getShareInfo, {
                shareTicket: shareTicket
            }).then(res => {
                let shareInfo = res;

                // SDK.showLoading('请稍候...');

                return promisify(wx.request, {
                    url: 'https://api.xiaoyouxiqun.com/gid.php',
                    data: {
                        game_id: SDK.game_id,
                        code: code,
                        encryptedData: shareInfo.encryptedData,
                        iv: shareInfo.iv,
                    },
                    header: {
                        'content-type': 'application/json'
                    },
                }).then(res => {
                    console.log('从服务器得到群信息: ', res);
                    if (res && res.data && res.data.code == 0 && res.data.opendata && res.data.opendata.openGId) {
                        return Promise.resolve(res.data.opendata.openGId);
                    } else {
                        return Promise.reject('群分享无效');
                    }
                });
            })
        })
    }


    static showVideo(success, fail) {
        SDK.hideBanner();
        SDK.showVideo((isEnd) => {
            if (isEnd) {
                console.log("视频播放成功！");
                success && success();
            } else {
                console.log("视频被跳过！");
                if (fail) {
                    fail('需要看完视频哦!');
                }
            }
            SDK.showBanner();
        }, () => {
            console.log("视频播放失败啦！");
            SDK.showBanner();
            if (fail) {
                fail('');
            }
        });
    }

    //获取每局游戏最多复活次数
    static getMaxReviveTimes() {
        return parseInt(SDK.max_revive_times) || Config.maxReviveTimes;
    }

    //获取每天最多分享次数
    static getMaxShareTimes() {
        return parseInt(SDK.max_share_times) || Config.maxShareTimes;
    }

    // TODO 分享次数是否OK
    static isShareCountValid(pos) {
        return DataBus.shareList.length < this.getMaxShareTimes();
    }

    //TODO 是否可以分享
    static hasShare(pos) {
        DataBus.checkShareTimestamp();

        let isShareCountValid = this.isShareCountValid(pos);
        console.log(`是否可以分享: share_flag:${SDK.share_flag}, 分数/需求分数:${DataBus.best}/${SDK.share_score}, 分享次数/是否OK:${DataBus.shareList.length}/${isShareCountValid}`);

        return (
            SDK.share_flag > -1 &&
            DataBus.best > (parseInt(SDK.share_score) || 0) &&
            isShareCountValid
        );
    }

    //TODO 获取分享或视频机率 (0到100, 当随机数小于此值, 则为分享, 否则为视频)
    //TODO 需要不同分享位置, 使用不同的下发参数
    static getShareOrVideoChance(pos) {
        //尺子
        if (pos == Utils.SharePos.ItemRuler) {
            return parseInt(SDK.ruler_chance) || 0;
        } 
        //复活
        else if(pos == Utils.SharePos.Revive) {
            return parseInt(SDK.revive_chance) || 0;
        }
        //复活币
        else if(pos == Utils.SharePos.ItemRevive) {
            return parseInt(SDK.revive_chance) || 0;
        }
    }

    //0为看视频, 1为分享, 其它为两者都无
    static isShareOrVideo(pos) {

        let allowShare = this.hasShare(pos);
        let hasVideo = SDK.hasVideo();

        //枚举 1:Share, 0:Video, -1:None
        let R = this.ShareVideoRet;
        let ret = R.None;
        //即可分享也可视频, 按概率随机
        if (allowShare && hasVideo) {
            let percent = this.getShareOrVideoChance(pos);
            let rate = percent / 100;
            let rnd = Math.random();
            ret = (rnd < rate) ? R.Share : R.Video;
            console.log(`isShareOrVideo: 即可分享也可视频, 概率(${rnd}), 据下发概率(${percent}), 返回结果: ${ret == R.Share ? '分享' : '视频'}`);
        }
        //仅可分享
        else if (allowShare) {
            console.log(`isShareOrVideo: 仅可分享, 返回结果: 分享1`);
            ret = R.Share;
        }
        //仅可视频
        else if (hasVideo) {
            console.log(`isShareOrVideo: 仅可视频, 返回结果: 视频0`);
            ret = R.Video;
        }
        //不能分享也不能视频
        else {
            console.log(`isShareOrVideo: 不能分享, 不能视频, 返回结果: -1`);
        }
        return ret;
    }

    //内部调用分享或视频, status为isShareOrVideo的返回值
    static shareOrVideo(status, pos, success, fail) {
        //分享
        if (status == this.ShareVideoRet.Share) {
            this.shareToGroup(pos, {}, success, fail);
        }
        //视频
        else if (status == this.ShareVideoRet.Video) {
            this.showVideo(success, fail);
        }
        //两者都无
        else {
            if (fail) {
                fail('视频未准备好!');
            }
        }
    }


    static submitLeaderboard(score) {
        return promisify(wx.login).then(res => {
            let code = res.code;
            return promisify(wx.getUserInfo, {
                withCredentials: true,
                lang: 'zh_CN',
            }).then(res => {
                return promisify(wx.request, {
                    url: 'https://leaderboard.xiaoyouxiqun.com/submit.php',
                    data: {
                        code: code,
                        iv: res.iv,
                        rawData: res.rawData,
                        encryptedData: res.encryptedData,
                        signature: res.signature,
                        game_id: SDK.game_id,
                        score: score,
                    },
                    method: 'POST',
                    header: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json',
                    },
                }).then(res => {
                    if (res && res.data && res.data.code == 0) {
                        return Promise.resolve(res);
                    } else {
                        return Promise.reject(res);
                    }
                });
            })
        });
    }

    static getLeaderboard() {
        return promisify(wx.login).then(res => {
            let code = res.code;
            return promisify(wx.request, {
                url: 'https://leaderboard.xiaoyouxiqun.com/get.php',
                data: {
                    code: code,
                    game_id: SDK.game_id,
                },
                method: 'POST',
                header: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
            }).then(res => {
                if (
                    res && res.data && res.data.code == 0 &&
                    res.data.data && Array.isArray(res.data.data.list)
                ) {
                    return Promise.resolve(res);
                } else {
                    return Promise.reject(res);
                }
            });
        });
    }

    static getUserIdOrCode(user_id) {
        let data = {
            user_id: '',
            code: '',
        };
        if(this.report_user_id) {
            return promisify(wx.checkSession).then(res => {
                data.user_id = user_id;
                return Promise.resolve(data);
            }).catch(res => {
                return promisify(wx.login).then(res => {
                    data.code = res.code;
                    return Promise.resolve(data);
                })
            });
        } else {
            return promisify(wx.login).then(res => {
                data.code = res.code;
                return Promise.resolve(data);
            })
        }
    }

    static reportAppid(auth_flag) {
        let data = {
            code: '',
            user_id: '',
            game_id: SDK.game_id,
            version: SDK.game_version,
            app_id: '',
            channel_id: '',
            auth_flag: auth_flag,
        }

        let op = wx.getLaunchOptionsSync();
        if (op.referrerInfo && op.referrerInfo.appId) {
            data.app_id = op.referrerInfo.appId;
        }
        if (op.query && op.query.cid) {
            data.channel_id = op.query.cid;
        }

        this.getUserIdOrCode(this.report_user_id).then(res => {
            data.code = res.code;
            data.user_id = res.user_id;
            console.log('准备报告来源appid: ', data);
            return promisify(wx.request, {
                url: 'https://statistics.xiaoyouxiqun.com/report.php',
                data: data,
                method: 'POST',
                header: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
            }).then(res => {
                if (res && res.data && res.data.user_id) { //用户有id
                    this.report_user_id = res.data.user_id;
                    console.log("保存报告来源的user_id:", this.report_user_id);
                }
                if (res.data.code == 0) {
                    console.log('报告来源appid成功: ', res);
                } else {
                    console.log('报告来源appid失败: ', res);
                }
            });
        }).catch(err => {
            console.log('报告来源appid失败: ', err);
        });
    }

    static groupFor(arr, num) {
        num <= 0 && (num = 1);
        let root = [];
        let len = arr.length;
        let times = Math.ceil(len / num);
        let index = 0;
        for (let i = 0; i < times; ++i) {
            let a = [];
            for(let j = 0; j < num; ++j) {
                if(index < len) {
                    a.push(arr[index]);
                    index++;
                } else {
                    break;
                }
            }
            root.push(a);
        }
        return root;
    }
}

Utils.sheet = null;


Utils.SharePos = {
    System: 93, //系统转发
    Main: 94, //首页转发
    Group: 95, //群排行分享
    Battle: 96, //挑战
    Revive: 97, //复活
    Flaunt: 98, //炫耀
    ItemRevive: 99, //复活道具
    Music: 100, //分享音乐
    ItemRuler: 101, //尺子道具
    93: 'System',
    94: 'Main',
    95: 'Group',
    96: 'Battle',
    97: 'Revive',
    98: 'Flaunt',
    99: 'ItemRevive',
    100: 'Music',
    101: 'ItemRuler',
}

Utils.ShareVideoRet = {
    Video: 0,
    Share: 1,
    None: -1,
}

Utils.LocalShare = {
    Group: {
        titleArr: [
            '看下你在群里排第几?'
        ],
        picArr: [],
        query: {},
    },
    Battle: {
        titleArr: [
            '我曾经跨过山和大海，也没遇到个像样的对手！',
        ],
        picArr: [],
        query: {},
    },
    Revive: {
        titleArr: [
            '灵魂乐手再现，莫扎特听了想狗带！'
        ],
        picArr: [],
        query: {},
    },
    Flaunt: {
        titleArr: [
            '我的帅气, 已经不允许我再这么低调了!',
        ],
        picArr: [],
        query: {},
    },
    ItemRevive: {
        titleArr: [
            '听八音盒神曲，尽在木板大师！'
        ],
        picArr: [],
        query: {},
    },
    Music: {
        titleArr: [
            '抖音神曲（八音盒版），了解下！'
        ],
        picArr: [],
        query: {},
    },
    ItemRuler: {
        titleArr: [
            '道具强力不恐怖，手抖的食堂大妈才可怕！'
        ],
        picArr: [],
        query: {},
    },
    defaultTitle: '听八音盒神曲，尽在木板大师！',
    defaultPic: 'res/unpack/share.jpg',
    getRandTitle(name) {
        if (!this[name] || !this[name].titleArr || this[name].titleArr.length == 0) {
            return this.defaultTitle;
        }
        let arr = this[name].titleArr;
        return arr[Utils.rnd_int(0, arr.length - 1)];
    },
    getRandPic(name) {
        if (!this[name] || !this[name].picArr || this[name].picArr.length == 0) {
            return this.defaultPic;
        }
        let arr = this[name].picArr;
        return arr[Utils.rnd_int(0, arr.length - 1)];
    },
    getQuery(name) {
        if (!this[name] || !this[name].query) {
            return {};
        }
        return this[name].query;
    }
};

/**
 * 创建一个UUID
 * 取自three.js
 */
Utils.generateUUID = (function () {
    // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136

    var lut = [];
    for (var i = 0; i < 256; i++) {
        lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
    }

    return function generateUUID() {
        var d0 = Math.random() * 0xffffffff | 0;
        var d1 = Math.random() * 0xffffffff | 0;
        var d2 = Math.random() * 0xffffffff | 0;
        var d3 = Math.random() * 0xffffffff | 0;
        var uuid = lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
            lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
            lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
            lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
        // .toUpperCase() here flattens concatenated strings to save heap memory space.
        return uuid.toUpperCase();
    };
})();

/**
 * 创建分享query字符串
 * @param {*} obj 
 */
Utils.generateQuery = function (obj) {
    let ret = '';
    for (let name in obj) {
        ret += `${name}=${obj[name]}&`;
    }
    ret += `uuid=${DataBus.uuid}&sid=${this.generateUUID()}&t=${(new Date()).getTime()}`;
    return ret;
}



/**
 * 检测玩家是否满足times次超score分的条件
 */
Utils.checkCondition = function (score, times) {
    let s = score,
        t = times;
    let r = DataBus.record;
    return (
        (s >= 0 && t >= 0) &&
        ((s > 500 && r.score1000 >= t) ||
            (s > 100 && r.score500 >= t) ||
            (s > 50 && r.score100 >= t) ||
            (s > 0 && r.score50 >= t) ||
            (s == 0 && r.play >= t))
    )
}

/**
 * 转换正交相机坐标到屏幕坐标
 * @param {*} camera 
 * @param {*} src 
 * @param {*} out 
 */
Utils.convertOrthographicCoordToScreenCoord = function (camera, src, out) {
    if (camera.isOrthographicCamera) {
        let m = camera.matrixWorldInverse;
        out.copy(src);
        out.applyMatrix4(m);
        let w = camera.right - camera.left;
        let h = camera.top - camera.bottom;
        let d = camera.far - camera.near;
        out.x = (out.x - camera.left) / w * Config.designWidth;
        out.y = Config.designHeight - (out.y - camera.bottom) / h * Config.designHeight;
        out.z = (out.z - camera.near) / d * 2 - 1;
        return true;
    }
    return false;
}

window.Utils = Utils;
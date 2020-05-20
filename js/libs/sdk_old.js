/**
 * sdk.js
 * 
 * 主程序使用 onShow, login, getUserInfo, updateScore,
 * enableShare, share, onShare, offShare 等接口与微信交互
 * 
 * 主程序使用 subMsg 与子域通信
 * 
 * 子域使用 getFriendsScore, getGroupScore, getUserInfoArray 等与微信交互
 * 
 */

/**
 * 参数配置
 */
let _GAME_ID = 'bridge01';
let _GAME_VERSION = 7;
let _CONFIG_URL = 'https://list.xiaoyouxiqun.com/conf.php';
let _SHARE_URL = 'https://share.xiaoyouxiqun.com/share_list.php';
let _INSIDE_ADS_URL = 'https://list.xiaoyouxiqun.com/get_list.php';
let _WALL_ADS_URL = ''; //https://list.xiaoyouxiqun.com/get_wall.php';
let _SHARE_STAT_URL = ''; //'https://share.xiaoyouxiqun.com/report.php';
let _REPORT_TIME_URL = ''; // 'https://report.xiaoyouxiqun.com/report_time.php';
//let _MORE_GAME_URL = 'https://api.zhuanziliuliangji.com/lottery/img/moregame.png';
let _VIDEO_ID = 'adunit-15291c4ca931d720';
let _ENABLE_VIDEO = true;
let _BANNER_ID = 'adunit-3bd5ec547ccf3028';
let _ENABLE_BANNER = true;
let _BANNER_POS = 1; //0上1下
let _TOAST_IMAGE = 'res/raw-assets/resources/toast.png';


//重写log
if (window.wx && typeof wx.getLogManager == 'function') {
    let logger = wx.getLogManager();
    if (logger) {
        let _log = console.log;
        console.log = function() {
            _log.apply(console, arguments);
            logger.log.apply(logger, arguments);
        }
        let _info = console.info;
        console.info = function() {
            _info.apply(console, arguments);
            logger.info.apply(logger, arguments);
        }
        let _warn = console.warn;
        console.warn = function() {
            _warn.apply(console, arguments);
            logger.warn.apply(logger, arguments);
        }
        let _debug = console.debug;
        console.debug = function() {
            _debug.apply(console, arguments);
            logger.debug.apply(logger, arguments);
        }
    }
}

//设为false则sdk内的log都不会打印
const _useLog = true;
const _log = _useLog ? console.log : () => {};

_log('SDK版本:', _GAME_VERSION);


/**
 * SDK开始
 */
const SDK = {
    /**
     * 游戏ID与游戏版本
     */
    game_id: _GAME_ID,
    game_version: _GAME_VERSION,

    /**
     * 拉取配置
     */
    pullCfg: true,
    lastPullTime: 0,

    /**
     * public:
     */

    /**
     * 远程配置地址
     */
    configUrl: _CONFIG_URL,

    /**
     * 远程分享配置地址
     */
    shareUrl: _SHARE_URL,

    /**
     * 横幅广告位置 0 上 1 下
     */
    bannerADPos: _BANNER_POS,
    /**
     * 横幅广告ID
     */
    banner_id: _BANNER_ID,
    /**
     * 是否启用横幅广告
     */
    banner_flag: _ENABLE_BANNER,
    /**
     * 激励广告ID
     */
    video_id: _VIDEO_ID,
    /**
     * 是否启用激励广告
     */
    video_flag: _ENABLE_VIDEO,
    /**
     * 分享参数
     */
    share_flag: -1,
    /**
     * 邀请参数
     */
    invite_flag: -1,

    /**
     * 奖品参数
     */
    prize_flag: -1,

    /**
     * 横幅广告刷新间隔秒,0不刷新
     */
    banner_refresh_interval: 0,

    /**
     * 内推广告
     */
    insideAds: {
        /**
         * 描述
         */
        desc: '内推广告',
        /**
         * 内推网址
         */
        url: _INSIDE_ADS_URL,
        /**
         * 内推广告列表
         * 列表中一项广告的示例: {id:'', icon:'', large:'', name:''}
         */
        list: [],
        /**
         * 内推广告配置
         */
        conf: {},
        /**
         * 内推广告改变时的回调
         */
        onChanged: null,
        /**
         * 广告是否存在
         */
        hasAds() {
            return (
                (!window.wx || typeof wx.navigateToMiniProgram == 'function') &&
                Array.isArray(this.list) && 
                this.list.length > 0
            );
        },
    },

    /**
     * 试玩游戏
     */
    wallAds: {
        /**
         * 描述
         */
        desc: '试玩墙',
        /**
         * 试玩网址
         */
        url: _WALL_ADS_URL,
        /**
         * 试玩游戏列表
         */
        list: [],
        /**
         * 试玩游戏配置
         */
        conf: {},
        /**
         * 试玩游戏改变时的回调
         */
        onChanged: null,
        /**
         * 广告是否存在
         */
        hasAds() {
            return (
                (!window.wx || typeof wx.navigateToMiniProgram == 'function') &&
                Array.isArray(this.list) && 
                this.list.length > 0
            );
        },
    },

    /**
     * 视频广告关闭的回调
     */
    onRewardsADClosed: null,

    /**
     * 视频广告加载成功的回调
     */
    onRewardsADLoaded: null,

    /**
     * 远程配置加载成功回调
     */
    onRemoteLoaded: null,

    /**
     * 第一次加载远程配置回调
     */
    onFirstConfigComplete: null,
    _firstGetConfig: true,

    /**
     * 系统配置
     */
    sys: {},


    /**
     * 添加一个监听小游戏回到前台事件的回调
     * 回调样本:
     * {
     *  scene:'',
     *  query:'{key:xxx}',
     *  shareTicket:'',
     * }
     * @param {string} name 名称
     * @param {Function} callback 回调
     * @param {number} order 顺序,大的先执行
     */
    onShow: function (name, callback, order = 0) {
        let index = this._onShowList.findIndex(o => o.name == name);
        if (index !== -1) {
            let o = this._onShowList[index];
            o.callback = callback;
            o.order = order;
        } else {
            this._onShowList.push({
                name: name,
                callback: callback,
                order: order
            });
        }
        //有未处理的回到前台事件
        if (this._onShowTempData) {
            this._runOnShowCallback(this._onShowTempData);
            this._onShowTempData = null;
        }
    },

    /**
     * 删除一个小游戏回到前台的回调
     * @param {string} name 名称
     */
    offShow: function (name) {
        const index = this._onShowList.findIndex(obj => obj.name == name);
        index >= 0 && this._onShowList.splice(index, 1);
        return index >= 0;
    },

    /**
     * 登录
     * @param {Boolean} needUserInfo 是否需要返回用户数据
     * @param {Function} onSuccess 
     * @param {Function} onFail 
     * @param {Function} onComplete 
     */
    login: function (needUserInfo = true, onSuccess = null, onFail = null, onComplete = null) {
        _log('SDK.login');
        if (!this._checkWx(onFail, onComplete)) {
            return;
        }
        /**
         * 曾经登录过则检测时效
         * 否则登录
         */
        wx.getStorage({
            key: '__uid',
            success: (res) => {
                //this._checkSession(needUserInfo, onSuccess, onFail, onComplete);
                onSuccess && onSuccess(res.data);
                onComplete && onComplete()
            },
            fail: () => {
                this._login(needUserInfo, onSuccess, onFail, onComplete);
            },
            complete: () => {
                //success与fail内运行complete
            }
        })

    },

    /**
     * 获取用户信息
     * onSuccess参数示例
     * {
     *      rawData:{},
     *      signature:undefined,
     *      userInfo:{
     *          avatarUrl:"http://xxx",
     *          city:"长沙",
     *          country:"中国",
     *          gender:1,
     *          language:"zh_CN",
     *          nickName:,
     *          province:"湖南",
     *      },
     * }
     * @param {*} onSuccess 
     * @param {*} onFail 
     * @param {*} onComplete 
     */
    getUserInfo: function (onSuccess = null, onFail = null, onComplete = null) {
        _log('SDK.getUserInfo');
        if (!this._checkWx(onFail, onComplete)) {
            return;
        }
        wx.getUserInfo({
            withCredentials: true,
            lang: 'zh_CN',
            success: onSuccess,
            fail: onFail,
            complete: onComplete,
        });
    },

    getUserInfoForce: function (onSuccess, onFail, onComplete) {
        _log('SDK.getUserInfoForce');
        if (!this._checkWx(onFail, onComplete)) {
            return;
        }
        this.showLoading('请稍候...', true);

        //延时防止上次的授修改未生效, 以及modal先于loading弹出的问题
        setTimeout(() => {
            this.getUserInfo(
                //getUserInfo成功
                (res) => {
                    this.hideLoading();
                    onSuccess && onSuccess(res);
                    onComplete && onComplete();
                },
                //getUserInfo失败
                (res) => {
                    //因为无授权而失败
                    if (res.errMsg.indexOf('auth deny') > -1 || res.errMsg.indexOf('auth denied') > -1) {
                        //隐藏loading,因为出现过loading显示在modal之上的情况
                        this.hideLoading();
                        this.showModal('提示', '游戏需要您授权头像和用户名信息',
                            //showModal成功
                            (res) => {
                                this.openSetting(
                                    //openSetting成功
                                    (res) => {
                                        this.hideLoading();

                                        _log('一直等待授权');
                                        this.getUserInfoForce(onSuccess, onFail, onComplete);

                                        // }
                                    },
                                    //openSetting失败
                                    (res) => {
                                        this.hideLoading();
                                        onFail && onFail(res);
                                        onComplete && onComplete();
                                    }
                                );
                            },
                            //showModal失败
                            (res) => {
                                this.hideLoading();
                                onFail && onFail(res);
                                onComplete && onComplete();
                            }
                        );
                    }
                    //其它原因导致失败
                    else {
                        this.hideLoading();
                        onFail && onFail(res);
                        onComplete && onComplete();
                    }
                }
            );
        }, 100);
    },

    /**
     * 据openid批量获取用户信息, 只能在子域调用
     * 成功返回res.data对象数组
     * 对象属性:
     * avatarUrl, city, country, gender, language, nickName, openId, province
     * @param {Array.<string>} openidList 要获取信息的用户的 openId 数组，如果要获取当前用户信息，则将数组中的一个元素设为 'selfOpenId'
     * @param {Function} onSuccess 
     * @param {Function} onFail 
     * @param {Function} onComplete 
     */
    getUserInfoArray: function (openidList, onSuccess, onFail, onComplete) {
        _log('SDK.getUserInfoArray');
        if (!this._checkWx(onFail, onComplete)) {
            return;
        }
        wx.getUserInfo({
            openIdList: openIdList,
            lang: 'zh_CN',
            success: onSuccess,
            fail: onFail,
            complete: onComplete,
        });
    },

    /**
     * data参数示例:
     * {score:88, time:20}或[ {key:'score',value:88}, {key:'time',value:20} ]
     * @param {(Object|Array)} data 
     * @param {Function} onSuccess 
     * @param {Function} onFail 
     * @param {Function} onComplete 
     */
    updateScore: function (data, onSuccess = null, onFail = null, onComplete = null) {
        _log('SDK.updateScore ' + JSON.stringify(data));
        if (!this._checkWx(onFail, onComplete, 'setUserCloudStorage')) {
            return;
        }
        const KVDataList = this._objectToKVArray(data);
        _log('kv array ' + JSON.stringify(KVDataList));
        wx.setUserCloudStorage({
            KVDataList: KVDataList,
            success: onSuccess,
            fail: onFail,
            complete: onComplete,
        });
    },

    /**
     *
     * 成功回调函数示例:
     * onSuccess = [](res){
     *      const player0 = res.data[0];//res.data是个玩家列表
     *      player0.avatarUrl;//头像
     *      player0.nickname;//昵称
     *      player0.openid;//id
     *      player0.data.score;//自定义的数据
     *      player0.KVDataList[0];//自定义的数据的key-value对数组
     * }
     * @param {string[]} keyList 
     * @param {Function} onSuccess 
     * @param {Function} onFail 
     * @param {Function} onComplete 
     */
    getFriendsScore: function (keyList = [], onSuccess = null, onFail = null, onComplete = null) {
        _log('SDK.getFriendsScore');
        if (!this._checkWx(onFail, onComplete, 'getFriendCloudStorage')) {
            return;
        }
        const success = (res) => {
            res.data.forEach(userGameData => {
                const kv = userGameData.KVDataList;
                const data = this._kvArrayToObject(kv);
                userGameData.data = data;
            });
            if (onSuccess) {
                onSuccess(res);
            }
        };
        wx.getFriendCloudStorage({
            keyList: keyList,
            success: success,
            fail: onFail,
            complete: onComplete,
        });
    },

    /**
     * 获取群内游戏数据
     * shareTicket群标识由onShow得来
     * 成功回调数据格式参考getFriendsScore
     * @param {string} shareTicket 标识是哪个群
     * @param {Array.<string>} keyList 要获取的数据key值数组
     * @param {Function} onSuccess 
     * @param {Function} onFail 
     * @param {Function} onComplete 
     */
    getGroupScore: function (shareTicket, keyList, onSuccess, onFail, onComplete) {
        _log('SDK.getGroupScore');
        if (!this._checkWx(onFail, onComplete, 'getGroupCloudStorage')) {
            return;
        }
        const success = (res) => {
            res.data.forEach(userGameData => {
                const kv = userGameData.KVDataList;
                const data = this._kvArrayToObject(kv);
                userGameData.data = data;
            });
            if (onSuccess) {
                onSuccess(res);
            }
        };
        wx.getGroupCloudStorage({
            shareTicket: shareTicket,
            keyList: keyList,
            success: success,
            fail: onFail,
            complete: onComplete,
        })
    },

    /**
     * 启用分享, 未启用时只能主动调用share来分享, 没有系统菜单
     * @param {*} onSuccess 
     * @param {*} onFail 
     * @param {*} onComplete 
     */
    enableShare: function (onSuccess, onFail, onComplete) {
        _log('SDK.enableShare');
        if (!this._checkWx(onFail, onComplete, 'showShareMenu')) {
            return;
        }
        if (!this._shareEnabled) {
            wx.showShareMenu({
                withShareTicket: true,
                success: (res) => {
                    this._shareEnabled = true;
                    if (onSuccess) {
                        onSuccess(res);
                    }
                },
                fail: (res) => {
                    if (onFail) {
                        onFail(res);
                    }
                    if (onComplete) {
                        onComplete(res);
                    }
                },
            })
        }
    },

    /**
     * 设置系统菜单分享的监听
     * @param {*} title 
     * @param {*} imageUrl 
     * @param {*} query 
     * @param {*} onSuccess 
     * @param {*} onFail 
     * @param {*} onComplete 
     */
    onShare: function (title, imageUrl, query, onSuccess, onFail, onComplete) {
        _log('SDK.onShare');
        if (!this._checkWx(onFail, onComplete)) {
            return;
        }
        const titleArr = [],
            imageArr = [];
        if (Array.isArray(title)) {
            title.forEach(t => titleArr.push(t));
        } else {
            titleArr.push(title);
        }
        if (Array.isArray(imageUrl)) {
            imageUrl.forEach(i => imageArr.push(i));
        } else {
            imageArr.push(imageUrl);
        }
        const _shareCallback = (res) => {
            SDK.pullCfg = false; //不需要重新拉取广告

            let t = '',
                i = '';
            if (titleArr.length != 0) {
                const titleIndex = Math.round(Math.random() * 1e11) % titleArr.length;
                t = titleArr[titleIndex];
            }
            if (imageArr.length != 0) {
                const imageIndex = Math.round(Math.random() * 1e11) % imageArr.length;
                i = imageArr[imageIndex];
            }
            return {
                title: t,
                imageUrl: i,
                query: query || '',
                success: onSuccess,
                fail: onFail,
                complete: onComplete,
            }
        };
        if (!this._shareEnabled) {
            this.enableShare(() => {
                wx.onShareAppMessage(_shareCallback);
            }, onFail, onComplete);
        } else {
            wx.onShareAppMessage(_shareCallback);
        }
    },
    /**
     * 关闭系统菜单的分享
     */
    offShare: function () {
        _log('SDK.offShare');
        if (!this._checkWx()) {
            return;
        }
        wx.offShareAppMessage();
    },

    /**
     * 设置系统菜单分享的监听
     * 参数shareCallback是一个函数, 函数的返回值示例:
     *         {
     *           title: '',
     *           imageUrl: '',
     *           query: '',
     *           success: null,
     *           fail: null,
     *           complete: null,
     *         }
     * 每次转发时, 微信都会调用这个shareCallback函数,
     * 得到转发的配置
     * @param {*} shareCallback 回调 
     */
    onShareWithCallback: function (shareCallback) {
        _log('SDK.onShareWithCallback');
        if (!this._checkWx()) {
            return;
        }
        if (!this._shareEnabled) {
            this.enableShare(() => {
                wx.onShareAppMessage(shareCallback);
            });
        } else {
            wx.onShareAppMessage(shareCallback);
        }
    },

    /**
     * 关闭系统菜单的分享
     */
    offShareWithCallback: function (shareCallback) {
        _log('SDK.offShareWithCallback');
        if (!this._checkWx()) {
            return;
        }
        wx.offShareAppMessage(shareCallback);
    },

    /**
     * 主动调用弹出分享界面
     * @param {*} title 
     * @param {*} imageUrl 
     * @param {*} query 
     * @param {*} onSuccess 
     * @param {*} onFail 
     * @param {*} onComplete 
     */
    share: function (title, imageUrl, query, onSuccess, onFail, onComplete) {
        _log('SDK.share');
        if (!this._checkWx(onFail, onComplete)) {
            return;
        }

        SDK.pullCfg = false; //不需要重新拉取广告

        const _shareOption = {
            title: title,
            imageUrl: imageUrl,
            query: query || '',
            success: onSuccess,
            fail: onFail,
            complete: onComplete,
        };

        if (!this._shareEnabled) {
            this.enableShare(() => {
                wx.shareAppMessage(_shareOption);
            }, onFail, onComplete);

        } else {
            wx.shareAppMessage(_shareOption);
        }
    },

    /**
     * 发送消息给子域
     * @param {*} msg  消息对象
     * @param {*} onFail 
     */
    subMsg: function (msg, onFail) {
        _log('SDK.subMsg');
        if (!this._checkWx(onFail, null, 'getOpenDataContext')) {
            return;
        }
        wx.getOpenDataContext().postMessage(msg);
    },

    /**
     * 在屏幕上显示一个文本提示
     * @param {*} msg  文本内容
     * @param {*} duration  持续时间 
     */
    showToast: function (msg, duration, onSuccess, onFail, onComplete) {
        _log('SDK.showToast');
        if (!this._checkWx(onFail, onComplete)) {
            return;
        }
        wx.showToast({
            title: msg,
            icon: 'none',
            // image: _TOAST_IMAGE,
            duration: duration || 1000,
            success: onSuccess,
            fail: onFail,
            complete: onComplete,
        });
    },

    showModal: function (title, content, onSuccess, onFail, onComplete) {
        _log('SDK.showModal');
        if (!this._checkWx(onFail, onComplete)) {
            return;
        }
        wx.showModal({
            title: title,
            content: content,
            showCancel: false,
            cancelText: '取消',
            confirmText: '确定',
            success: onSuccess,
            fail: onFail,
            complete: onComplete,
        });
    },

    openSetting(onSuccess, onFail, onComplete) {
        _log('SDK.openSetting');
        if (!this._checkWx(onFail, onComplete)) {
            return;
        }
        wx.openSetting({
            success: onSuccess,
            fail: onFail,
            complete: onComplete,
        });
    },


    /**
     * 显示一个loading界面
     * @param {*} msg   标题
     * @param {*} mask  是否遮罩
     * @param {*} onSuccess 
     * @param {*} onFail 
     * @param {*} onComplete 
     */
    showLoading: function (msg, mask, onSuccess, onFail, onComplete) {
        _log('SDK.showLoading');
        if (!this._checkWx(onFail, onComplete, 'showLoading')) {
            return;
        }
        wx.showLoading({
            title: msg,
            mask: mask,
            onSuccess,
            onFail,
            onComplete
        });
    },
    hideLoading: function (onSuccess, onFail, onComplete) {
        _log('SDK.hideLoading');
        if (!this._checkWx(onFail, onComplete, 'hideLoading')) {
            return;
        }
        wx.hideLoading({
            onSuccess,
            onFail,
            onComplete
        });
    },

    /**
     * 广告加载成功
     */
    _rewardsAdLoaded: false,

    /**
     * 是否有视频广告
     */
    hasVideo: function () {
        // _log('SDK.hasVideo');
        if(this._videoAd && this._videoAd.isReady) {
            let ret = this._videoAd.isReady();
            _log('SDK.hasVideo: 调用微信函数videoAd.isReady()返回:', ret);
            return ret;
        }
        let ret = this.video_flag && this._videoAd && this._rewardsAdLoaded;
        _log('SDK.hasVideo: ', ret);
        return ret;
    },

    /**
     * 显示视频广告
     * @param {*} onClose //视频看完关闭时的回调
     * @param {*} onFail //失败回调
     */
    showVideo: function (onClose, onFail) {
        _log('SDK.showVideo');
        if (this.video_flag) {
            if (this._videoAd) {
                //回调
                this.onRewardsADClosed = onClose;
                //加载广告, 如果广告已自动加载不会重新加载
                this._videoAd.load().then(() => {
                    _log('广告对象: ', this._videoAd);
                    //显示广告
                    this._videoAd.show().then(() => {
                        this._rewardsAdLoaded = false;
                        _log('视频广告播放成功!');
                    }).catch(err => {
                        _log('视频广告播放失败: ', err);
                        onFail && onFail(err);
                    });
                }).catch(err => {
                    _log('视频广告加载失败: ', err);
                    onFail && onFail(err);
                });
            } else {
                _log('视频广告组件未创建!');
                onFail && onFail({
                    errMsg: '视频广告组件未创建!'
                });
            }
        } else {
            _log('未启用视频广告!');
            onFail && onFail({
                errMsg: '未启用视频广告!'
            });
        }
    },


    /**
     * 显示横幅广告
     */
    _bannerTimer: 0,
    _bannerVisible: false,
    showBanner: function () {
        _log('SDK.showBanner');
        this._bannerVisible = false;
        if (this._btnCloseBanner) {
            this._btnCloseBanner.hide();
        }
        if (this.banner_flag) {
            //定时加载显示广告
            let delayUpdateBanner = (delay) => {
                if (delay > 0) { //大于0才刷新
                    if (this._bannerTimer) {
                        clearTimeout(this._bannerTimer);
                        this._bannerTimer = 0;
                    }
                    this._bannerTimer = setTimeout(() => {
                        if (this._banner) {
                            _log('定时移除横幅广告');
                            this._banner.destroy();
                            this._banner = null;
                            this._bannerVisible = false;
                        }
                        _log('定时重新显示横幅广告');
                        this.showBanner();
                    }, delay * 1000);
                }
            }
            //成功显示后的处理
            let afterSuccess = () => {
                _log('横幅广告显示成功!');
                this._bannerVisible = true;
                if (this._btnCloseBanner) {
                    _log('显示横幅广告关闭按钮');
                    this._btnCloseBanner.show();
                }
                //定时刷新
                delayUpdateBanner(this.banner_refresh_interval);
            }
            let afterFail = (err) => {
                _log('横幅广告显示失败! ', err);
                _log(`将在${this.banner_refresh_interval}秒后重试(hideBanner会取消重试)`);
                delayUpdateBanner(this.banner_refresh_interval);
            }
            //创建并显示
            let createAndShowFunc = () => {
                this._createBannerAd(() => {
                    this._banner.show().then(() => {
                        afterSuccess();
                    }).catch((err) => {
                        afterFail(err);
                    });
                }, (err) => {
                    afterFail(err);
                }, (res) => {
                    _log('横幅广告调整尺寸: ', res);
                    _log('横幅广告样式: ', this._banner.style);
                });
            };
            if (this._banner) {
                //显示广告, 如果失败, 则说明未加载好, 需要重建横幅广告
                this._banner.show().then(() => {
                    afterSuccess();
                }).catch((err) => {
                    createAndShowFunc();
                });
            } else {
                createAndShowFunc();
            }

        } else {
            _log('未启用横幅广告!');
        }
    },
    /**
     * 隐藏横幅广告
     */
    hideBanner: function () {
        _log('SDK.hideBanner');
        this._bannerVisible = false;
        if (this._banner) {
            this._banner.hide();
        }
        if (this._btnCloseBanner) {
            _log('隐藏横幅广告关闭按钮');
            this._btnCloseBanner.hide();
        }
        if (this._bannerTimer) {
            clearTimeout(this._bannerTimer);
            this._bannerTimer = 0;
        }
    },

    /**
     * 展示图片
     */
    showImage: function (url, onSuccess, onFail, onComplete) {
        _log('SDK.showImage');
        if (!this._checkWx(onFail, onComplete)) {
            return;
        }
        wx.previewImage({
            current: url,
            urls: [url],
            success: (res) => {
                SDK.pullCfg = false; //不需要重新拉取广告
                onSuccess(res);
            },
            fail: onFail,
            complete: onComplete,
        })
    },

    /**
     * 显示更多游戏
     */
    showMoreGameAds: function (onSuccess, onFail, onComplete) {
        _log('SDK.showMoreGameAds');
        this.showImage(_MORE_GAME_URL, onSuccess, onFail, onComplete);
    },

    /**
     * 显示内推广告
     */
    showInsideAds: function (obj, onSuccess, onFail, onComplete) {
        _log('SDK.showInsideAds');

        let app_id = obj.app_id;
        let app_path = obj.app_path;

        if (
            window.wx &&
            typeof wx.navigateToMiniProgram == 'function' &&
            obj.app_id
        ) {
            _log('直接跳转至小程序');
            wx.navigateToMiniProgram({
                appId: obj.app_id,
                path: obj.app_path,
                extraData: '',
                success: (res) => {
                    if (res && res.errMsg && res.errMsg.indexOf('fail') > -1) {
                        _log('直接跳转至小程序成功, 但有错误信息: ', res);
                        onFail && onFail(res);
                    } else {
                        _log('直接跳转至小程序成功: ', res);
                        onSuccess && onSuccess(res);
                    }
                },
                fail: onFail,
                complete: onComplete,
            })
        } else {
            // let url = obj.image;
            // this.showImage(url, onSuccess, onFail, onComplete);
            _log('不支持跳转至小程序');
            onFail && onFail();
            onComplete && onComplete();
        }
    },


    /**
     * 获取远程加载的分享配置, 不存在,未拉取,图片尚未下载好时返回null
     * 返回示例:
     * {
     *      position_id:0,      //分享位置ID, 区分是哪个地方调用的分享
     *      share_id:0,         //分享配置ID, 服务器返回的这个分享配置的ID
     *      share_text:'',      //分享文本
     *      share_pic:'',       //分享图片, 是一个网址
     *      share_pic_local:'', //分享图片, 是share_pic下载到本地后的地址
     * }
     */
    getShareConfig: function (pos) {
        if (!this._shareConfig) {
            return null;
        }
        let index = this._shareConfig.findIndex(o => o.position_id == pos);
        if (index == -1) {
            return null;
        }
        let config = this._shareConfig[index];
        if (!config.share_pic_local) {
            return null;
        }
        _log('使用远程分享配置: ', pos, '  config: ', config);
        return config;
    },

    /**
     * 分享统计
     * 用于从分享点击进入游戏的统计
     * @param {*} position_id 分享来源位置
     * @param {*} share_id 分享配置ID
     * @param {*} self 是否自已点击 0为他人点击 1为自已点击
     */
    shareStat(position_id, share_id, self = 0) {

        if (!_SHARE_STAT_URL) {
            return;
        }
        wx.request({
            url: _SHARE_STAT_URL,
            data: {
                game_id: _GAME_ID,
                version: _GAME_VERSION,
                position_id: position_id,
                share_id: share_id,
                self: self,
            },
            header: {
                // 'content-type': 'application/json'
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            success: (res) => {
                _log('分享统计提交成功: ', res);
            },
            fail: (res) => {
                _log('分享统计提交失败: ', res);
            }
        });
    },


    /**
     * 比较两个版本号, 当v1大于v2时, 返回正数, v1等于v2时, 返回零, 否则返回负数
     * 如1.2.3和1.1.9返回正数, 0.2.0和0.2返回零, 1.5.99和1.6返回负数
     * @param {*} v1 
     * @param {*} v2 
     */
    compareVersion(v1, v2) {
        (typeof v1 != 'string') && (v1 = (v1.toString ? v1.toString() : '0'));
        (typeof v2 != 'string') && (v2 = (v2.toString ? v2.toString() : '0'));
        let arr1 = v1.split('.');
        let arr2 = v2.split('.');
        let len = Math.max(arr1.length, arr2.length);
        let diff = 0;
        for (let i = 0; i < len; ++i) {
            diff = (parseInt(arr1[i]) || 0) - (parseInt(arr2[i]) || 0);
            if (diff != 0) {
                break;
            }
        }
        return diff;
    },

    /**
     * 微信版本 比指定版本高时 返回正数, 相等返回0, 否则返回负数
     * @param {*} v 
     */
    checkWxVersion(v) {
        if (!this._checkWx()) {
            return -1;
        }
        return this.compareVersion(this.sys.version, v);
    },

    /**
     * 微信基础库版本 比指定版本高时 返回正数, 相等返回0, 否则返回负数
     * @param {*} v 
     */
    checkWxSdkVersion(v) {
        if (!this._checkWx()) {
            return -1;
        }
        return this.compareVersion(this.sys.SDKVersion || '1.0.1', v);
    },

    /**
     * 是否ios系统
     */
    isIos() {
        if (!this._checkWx()) {
            return false;
        }
        return this.sys.platform == 'ios' || this.sys.system.indexOf('iOS') >= 0;
    },
    /**
     * 是否安卓系统
     */
    isAndroid() {
        if (!this._checkWx()) {
            return false;
        }
        return this.sys.platform == 'android' || this.sys.system.indexOf('Android') >= 0;
    },

    /**
     * 是否iPhoneX
     */
    isIphoneX() {
        if (!this._checkWx()) {
            return false;
        }
        return !!this.sys.model.match('iPhone X');
    },

    
    reportTime(tag, code, time_used) {
        if(!_REPORT_TIME_URL || !window.wx) {
            return;
        }
        let report = (network_type, battery_level) => {
            let sys = SDK.sys || {};
            let data = {
                "sdk_version": sys.SDKVersion,
                "version": sys.version,
                "model": sys.model,
                "system": sys.system,
                "battery_level": battery_level,
                "network_type": network_type,
                "game_id": _GAME_ID,
                "tag": tag,
                "code": code,
                "time_used": time_used,
            };
            _log('准备上报请求时间: ', data);
            wx.request({
                url: _REPORT_TIME_URL,
                data: {
                    data: JSON.stringify(data),
                },
                method: 'POST',
                header: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                success: res => {
                    _log('上报请求时间成功: ', res);
                },
                fail: res => {
                    _log('上报请求时间失败: ', res);
                }
            });
        }
        let getBatteryLevel = network_type => {
            wx.getBatteryInfo ? wx.getBatteryInfo({
                success: res => {
                    report(network_type, res.level);
                },
                fail: res => {
                    report(network_type, 0);
                }
            }) : report(network_type, 0);
        }
        wx.getNetworkType ? wx.getNetworkType({
            success: res => {
                getBatteryLevel(res.networkType);
            },
            fail: res => {
                getBatteryLevel('fail');
            }
        }) : getBatteryLevel('fail');
        
    },



    /**
     * private:
     */

    /**
     * 标记分享是否已经开启
     */
    _shareEnabled: false,


    /**
     * 检测wx环境及相关方法是否存在
     * @param {*} onFail 
     * @param {*} onComplete 
     * @param {string} methodName wx的方法名
     */
    _checkWx: function (onFail, onComplete, methodName) {
        //不在微信小游戏环境
        if (typeof wx == 'undefined') {
            if (onFail) {
                onFail();
            }
            if (onComplete) {
                onComplete();
            }
            return false;
            //函数不存在, 可能是微信版本过低
        } else if (methodName && wx[methodName] == undefined) {
            if (onFail) {
                onFail({
                    code: 999,
                    errMsg: '请升级你的微信版本!'
                });
            }
            if (onComplete) {
                onComplete();
            }
            return false;
        }
        return true;
    },

    /**
     * 对象转键值对
     * @param {Object} data 
     */
    _objectToKVArray: function (data) {
        let ret = [];
        if (data instanceof Object) {
            for (let i in data) {
                ret.push({
                    'key': i,
                    'value': data[i] + '',
                });
            }
        } else if (data instanceof Array) {
            ret = data;
        }
        return ret;
    },
    /**
     * 键值对数据转对象
     * @param {Array} arr 
     */
    _kvArrayToObject: function (arr) {
        const ret = {};
        arr.forEach(v => {
            if (v.key != undefined && v.value != undefined) {
                ret[v.key] = v.value;
            }
        });
        return ret;
    },

    /**
     * 检测登录是否超时
     * @param {*} needUserInfo 
     * @param {*} onSuccess 
     * @param {*} onFail 
     * @param {*} onComplete 
     */
    _checkSession: function (needUserInfo = true, onSuccess = null, onFail = null, onComplete = null) {
        wx.checkSession({
            success: () => {
                if (needUserInfo) {
                    SDK.getUserInfo(onSuccess, onFail, onComplete);
                } else {
                    if (onSuccess) {
                        onSuccess();
                    }
                    if (onComplete) {
                        onComplete();
                    }
                }
            },
            fail: () => {
                this._login(needUserInfo, onSuccess, onFail, onComplete);
            },
            complete: () => {
                //success与fail内运行complete
            }
        });
    },
    /**
     * 登录
     * @param {*} needUserInfo 
     * @param {*} onSuccess 
     * @param {*} onFail 
     * @param {*} onComplete 
     */
    _login: function (needUserInfo = true, onSuccess = null, onFail = null, onComplete = null) {
        wx.login({
            success: (res) => {
                _log('login code: ' + res.code);
                /**
                 * 登录后本地标记已登录过
                 */
                // wx.setStorage({
                //     key: '__uid',
                //     data: uid,
                // })
                if (needUserInfo) {
                    SDK.getUserInfo(onSuccess, onFail, onComplete);
                } else {
                    if (onSuccess) {
                        onSuccess(res);
                    }
                    if (onComplete) {
                        onComplete();
                    }
                }
            },
            fail: () => {
                if (onFail) {
                    onFail();
                }
                if (onComplete) {
                    onComplete();
                }
            },
            complete: () => {
                //success与fail内运行complete
            }
        });
    },

    /**
     * onShow回调相关
     */
    _onShowList: [],
    _onShowTempData: null,
    _runOnShowCallback: function (res) {
        _log('_runOnShowCallback');
        _log(res);
        this._onShowList.sort((a, b) => b.order - a.order);
        const length = this._onShowList.length;
        if (length == 0) {
            this._onShowTempData = res;
        } else {
            this._onShowList.forEach(obj => {
                obj && obj.callback && obj.callback(res);
            })
        }
    },

    /**
     * 拉取广告及其它配置
     */
    _getRemoteConfig: function (onSuccess = null, onFail = null, onComplete = null) {
        let launchOptions = wx.getLaunchOptionsSync();
        let data = {
            game_id: _GAME_ID,
            version: _GAME_VERSION,
            cid: '',
            os: '',
        };
        if (launchOptions.query && launchOptions.query.cid) {
            data.cid = launchOptions.query.cid;
        }
        if (SDK.sys && SDK.sys.platform && typeof SDK.sys.platform == 'string') {
            data.os = SDK.sys.platform.toLowerCase();
            if (data.os != 'android' && data.os != 'ios') {
                data.os = "";
            }
        }
        wx.request({
            url: this.configUrl,
            header: {
                // 'content-type': 'application/json'
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            method: 'POST',
            data: data,
            success: onSuccess,
            fail: onFail,
            complete: onComplete,
        });
    },

    /**
     * 远程拉取分享标题图片配置
     */
    _shareConfig: null,
    _getRemoteShareConfig: function () {
        if (!this.shareUrl) {
            return;
        }
        wx.request({
            url: this.shareUrl,
            data: {
                game_id: _GAME_ID,
                version: _GAME_VERSION,
            },
            header: {
                // 'content-type': 'application/json'
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            success: (res) => {
                if (res.statusCode == 200 && res.data) {
                    try {
                        let data;
                        if (typeof res.data == 'string') {
                            data = JSON.parse(res.data);
                        } else {
                            data = res.data;
                        }
                        //成功获取
                        if (data.code != undefined && data.code == 0 && Array.isArray(data.share)) {
                            _log('远程拉取分享配置成功: ', data);
                            this._shareConfig = data.share;
                            this._loadShareImage();
                        } else {
                            _log('远程拉取分享配置失败: ', data);
                            this._shareConfig = null;
                        }
                    } catch (e) {
                        _log('远程拉取分享配置失败: ', e);
                        this._shareConfig = null;
                    }
                } else {
                    _log('远程拉取分享配置失败: ', res);
                    this._shareConfig = null;
                }
            },
            fail: (res) => {
                _log('远程拉取分享配置失败: ', res);
                this._shareConfig = null;
            },
        });
    },
    _downloadedFiles: [],
    _loadShareImage() {
        let arr = this._shareConfig;
        //全部完成, 才输出LOG, 避免LOG过多
        let logs = [];
        let addLog = (str, obj) => {
            logs.push(str + JSON.stringify(obj));
            if(logs.length >= arr.length) {
                _log('下载分享图片完成: ', logs);
            }
        }
        arr.forEach((obj, i) => {
            //检查是否已经下载
            let index = this._downloadedFiles.findIndex(o => o.url == obj.share_pic);
            if (index != -1) {
                let o = this._downloadedFiles[index];
                obj.share_pic_local = o.file;
                addLog('使用已经下好的文件:', o.file);
                return;
            }
            //下载
            setTimeout(() => {
                wx.downloadFile({
                    url: obj.share_pic,
                    header: {},
                    success: (res) => {
                        if (res.statusCode == 200) {
                            addLog('下载文件成功:', res);
                            obj.share_pic_local = res.tempFilePath;
                            this._downloadedFiles.push({
                                url: obj.share_pic,
                                file: res.tempFilePath,
                            });
                        } else {
                            addLog('下载文件出错:', res);
                        }
                    },
                    fail: (err) => {
                        addLog('下载文件出错:', err);
                    },
                });
            }, i * 200);
        });
    },

    _getAds: function (ads) {
        if (!ads.url) {
            return;
        }
        wx.request({
            url: ads.url,
            data: {
                game_id: _GAME_ID,
                version: _GAME_VERSION,
            },
            method: 'POST',
            header: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            success: (res) => {
                if (res.statusCode == 200 && res.data && res.data.code == 0) {
                    let data = res.data;
                    _log(`远程拉取${ads.desc}成功: `, data);
                    ads.list = Array.isArray(data.list) ? data.list : [];
                    ads.conf = data.conf || {};
                    if (ads.onChanged) {
                        ads.onChanged(ads);
                    }
                } else {
                    _log(`远程拉取${ads.desc}失败: `, res);
                }
            },
            fail: (res) => {
                _log(`远程拉取${ads.desc}失败: `, res);
            },
        });
    },

    /**
     * 创建横幅
     */
    _bannerResetPosition: false,
    _btnCloseBanner: null,
    _timerBtnCloseBanner: 0,
    _createBannerAd: function (onLoad, onError, onResize) {
        _log('SDK._createBannerAd');
        if (!this._checkWx(null, null, 'createBannerAd')) {
            _log('微信版本不支持横幅广告!');
            return;
        }
        //销毁已有广告
        if (this._banner) {
            this._banner.destroy();
            this._banner = null;
        }
        if (this._btnCloseBanner) {
            this._btnCloseBanner.destroy();
            this._btnCloseBanner = null;
        }
        const sysWidth = this.sys.screenWidth;
        const sysHeight = this.sys.screenHeight;
        const width = 300;
        // const height = Math.floor(width * 0.2);
        this._bannerResetPosition = false;
        this._banner = wx.createBannerAd({
            adUnitId: this.banner_id,
            style: {
                left: (sysWidth - width) / 2,
                top: (this.bannerADPos == 0) ? 0 : (sysHeight - 104),
                width: width,
                // height: height,
            }
        })
        this._banner.onResize && this._banner.onResize((res) => {
            //避免循环调整尺寸
            if (!this._bannerResetPosition) {

                //调整位置
                if (this.bannerADPos == 1) {
                    let top = this.sys.screenHeight - res.height;
                    if (!!this.sys.model.match("iPhone X")) {
                        top += 1;
                    }
                    this._banner.style.top = top;
                }

                //创建关闭按钮
                // if (typeof wx.createUserInfoButton == 'function') {
                //     clearTimeout(this._timerBtnCloseBanner);
                //     this._timerBtnCloseBanner = setTimeout(() => {

                //         let width = 22, height = 11, margin = 4;
                //         let button = wx.createUserInfoButton({
                //             type: 'text',
                //             text: '关闭',
                //             style: {
                //                 left: this._banner.style.left + this._banner.style.realWidth - margin - width,
                //                 top: this._banner.style.top + margin,
                //                 width: width,
                //                 height: height,
                //                 lineHeight: height,
                //                 backgroundColor: '#00000080',
                //                 color: '#ffffff',
                //                 textAlign: 'center',
                //                 fontSize: 9,
                //                 borderRadius: 2
                //             }
                //         });
                //         button.onTap((res) => {
                //             _log(res);
                //             this.hideBanner();
                //         });
                //         _log('关闭按钮: ', button);

                //         this._btnCloseBanner = button;
                //         if(!this._bannerVisible){
                //             this._btnCloseBanner.hide();
                //         }else{
                //             this._btnCloseBanner.show();
                //         }
                //     }, 1000);

                // }

                this._bannerResetPosition = true;
                onResize && onResize(res);
            }
        });
        this._banner.onLoad(onLoad);
        this._banner.onError(onError);
        return this._banner;
    },



    /**
     * 加载视频广告
     */
    _loadRewardedVideoAd: function () {
        _log('SDK._loadRewardedVideoAd');
        if (!this._checkWx(null, null, 'createRewardedVideoAd')) {
            _log('微信版本不支持视频广告!');
            return;
        }
        //销毁已有广告 //
        // if (this._videoAd) {
        //     this._videoAd.destroy();
        // }
        //创建广告 //创建时会自动拉取广告, 不需要手动load
        this._videoAd = wx.createRewardedVideoAd({
            adUnitId: this.video_id
        });
        _log('视频广告已创建: ', this._videoAd);
        //广告看完时的回调
        this._videoAd.onClose((res) => {
            _log('看完广告回调参数: ', res);
            if (this.onRewardsADClosed) {
                let isEnd = (res && res.isEnded !== undefined) ? res.isEnded : true;
                this.onRewardsADClosed(isEnd);
            }
        })
        //广告加载成功回调
        this._videoAd.onLoad(() => {
            _log('一条视频广告加载成功!');
            this._rewardsAdLoaded = true;

            //回调
            if (this.onRewardsADLoaded) {
                this.onRewardsADLoaded();
            }
        });
        //广告加载失败回调
        this._videoAd.onError(err => {
            _log('加载一条视频广告时出错了: ', err);
            this._rewardsAdLoaded = false;
            //延时尝试重新加载
            setTimeout(() => {
                if (this.video_flag && this._videoAd) {
                    this._videoAd.load().then(() => {

                    });
                }
            }, 3000);
        })
    },
    /**
     * 销毁视频广告
     */
    // _destroyRewardedVideoAd: function () {
    //     _log('SDK._destroyRewardedVideoAd');
    //     if (this._videoAd) {
    //         this._videoAd.destroy();
    //         this._videoAd = null;
    //     }
    // },
};
/**
 * SDK结束
 */

if (typeof module != 'undefined') module.exports = SDK;
window.SDK = SDK;

/**
 * 获取微信配置
 */
if (typeof wx != 'undefined' && wx.getSystemInfoSync) {
    SDK.sys = wx.getSystemInfoSync();
    _log('SDK.sys', SDK.sys);
}


/**
 * 允许视频广告且有视频广告ID, 直接创建视频广告
 */
if (SDK.video_flag && SDK.video_id && !SDK._videoAd) {
    SDK._loadRewardedVideoAd();
}


/**
 * SDK开始监听小游戏回到前台事件
 */
if (typeof wx != 'undefined' && wx.onShow) {

    //监听
    wx.onShow((res) => {
        //分发事件监听
        SDK._runOnShowCallback(res);
        //拉取配置
        let time = new Date().getTime() / 1000 - SDK.lastPullTime;
        if (SDK.pullCfg && time > 3) {
            SDK.lastPullTime = new Date().getTime() / 1000;
            //拉取配置
            SDK._getRemoteConfig((res) => {
                _log('远程拉取配置(res): ', res);
                if (res.statusCode == 200 && res.data) {
                    try {
                        let data;
                        if (typeof res.data == 'string') {
                            data = JSON.parse(res.data);
                        } else {
                            data = res.data;
                        }
                        //成功获取
                        if (data.code != undefined && data.code == 0) {
                            //配置
                            _log('拉取到的配置(data.conf): ', data.conf);
                            if (data.conf) {
                                for (let i in data.conf) {
                                    //原来没有视频ID, 此次有下发视频ID
                                    if (i == 'video_id' && data.conf[i] && !SDK[i]) {
                                        SDK[i] = data.conf[i];
                                        SDK._loadRewardedVideoAd();
                                        continue;
                                    }
                                    //本地广告ID不需要被替换
                                    if ((i == 'video_id' || i == 'banner_id') && SDK[i]) {
                                        continue;
                                    }
                                    //更新配置
                                    SDK[i] = data.conf[i];
                                };
                            }
                            if (SDK.onRemoteLoaded) {
                                SDK.onRemoteLoaded(data.conf);
                            }
                        } else {
                            _log('远程拉取配置出错(code): ', data);
                        }
                    } catch (err) {
                        _log('远程拉取配置出错(catch): ', err);
                    }
                }
            }, (err) => {
                _log('远程拉取配置失败(fail): ', err);
            }, () => {
                if (SDK._firstGetConfig) {
                    SDK._firstGetConfig = false;
                    SDK.onFirstConfigComplete && SDK.onFirstConfigComplete();
                }
            });
            //拉取内推广告
            SDK._getAds(SDK.insideAds);
            //拉取试玩墙
            SDK._getAds(SDK.wallAds);
            //拉取分享配置
            SDK._getRemoteShareConfig();
        } else {
            //重置为true
            SDK.pullCfg = true;
        }
    });
}



/**
 * 当有更新时应用更新并重启
 */
if (typeof wx != 'undefined' && typeof wx.getUpdateManager === 'function') {
    const updateManager = wx.getUpdateManager()

    updateManager.onCheckForUpdate(function (res) {
        // 请求完新版本信息的回调
        _log('hasUpdate:' + res.hasUpdate)
    })

    updateManager.onUpdateReady(function () {
        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
        updateManager.applyUpdate()
    })

    updateManager.onUpdateFailed(function () {
        // 新的版本下载失败
    })
}
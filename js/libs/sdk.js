/**
 * sdk.js
 * 
 * 
 */

/**
 * 参数配置
 */
let _CONFIG_URL = 'https://list.xiaoyouxiqun.com/conf.php';
let _INSIDE_ADS_URL = 'https://list.xiaoyouxiqun.com/get_list.php';
let _WALL_ADS_URL = 'https://list.xiaoyouxiqun.com/get_wall.php';
let _CONFIG_CDN_URL = 'https://datacache.xiaoyouxiqun.com/conf/';
let _INSIDE_ADS_CDN_URL = 'https://datacache.xiaoyouxiqun.com/promotion/list/';
let _WALL_ADS_CDN_URL = 'https://datacache.xiaoyouxiqun.com/promotion/wall/';
let _SHARE_URL = 'https://share.xiaoyouxiqun.com/share_list.php';
let _SHARE_STAT_URL = 'https://share.xiaoyouxiqun.com/report.php';
let _REPORT_TIME_URL = 'https://report.xiaoyouxiqun.com/report_time.php';
let _REPORT_ADS_CLICK_URL = 'https://report.xiaoyouxiqun.com/report_click.php';


//用于打印sdk内的log
let _log = (...arg) => console.info(...arg);



/**
 * SDK开始
 */
const SDK = {

    init({
        game_id,    //游戏ID
        game_version,    //游戏版本
        videoId,    //视频id, 数组或字符串
        bannerId,   //横幅id, 数组或字符串
        onBannerPlaced = onBannerPlacedBottomDefault,    //横幅创建时定位 //SDK.bannerMethod.placedBottom
        onBannerResize = onBannerResizeBottomDefault,    //横幅尺寸确定后定位 //SDK.bannerMethod.resizeBottom
        configUseCdn = false,  //拉取配置使用CDN
        autoPullInterval = 3,    //自动拉取后, ?秒内不再自动拉取配置
        autoPullAllConfig = true,    //设置为true则后台返回时自动拉取配置, 如果此时主配置从未拉取过, 则会立即拉取一次所有自动配置
        autoPullMainConfig = true,   //后台返回时是否拉取主配置
        autoPullShare = true,    //后台返回时是否拉取分享配置
        autoPullInsideAds = true,    //后台返回时是否拉取内推数据
        autoPullWallAds = false,  //后台返回时是否拉取试玩数据
        needReportTime = false,  //拉取主配置结束时, 是否向服务器报告拉取时间(测试用)
        printLog = true, //SDK是否打印LOG
        saveLog = true,  //是否保存所有LOG到存储(开启后用户提交反馈时可以提交LOG)
    }) {

        this.game_id = game_id;
        this.game_version = game_version;
        this.video_ids = Array.isArray(videoId) ? videoId : videoId ? [videoId] : [];
        this.banner_ids = Array.isArray(bannerId) ? bannerId : bannerId ? [bannerId] : [];
        this.onBannerPlaced = onBannerPlaced;
        this.onBannerResize = onBannerResize;
        this.configUseCdn = configUseCdn;
        this.autoPullInterval = autoPullInterval;
        this.autoPullMainConfig = autoPullMainConfig;
        this.autoPullShare = autoPullShare;
        this.autoPullInsideAds = autoPullInsideAds;
        this.autoPullWallAds = autoPullWallAds;
        this.needReportTime = needReportTime;

        _log = printLog ? (...arg) => console.info(...arg) : () => {};
        setSaveLog(saveLog);

        this.sys = (window.wx && wx.getSystemInfoSync) ? wx.getSystemInfoSync() : {};

        _log('游戏版本: ', this.game_version);
        _log('SDK版本: ', this.version);

        this.banner_ids = this._shuffle(this.banner_ids);
        this.video_ids = this._shuffle(this.video_ids);

        this.video_ids.length > 0 && this._loadRewardedVideoAd();

        //分发事件监听
        window.wx && wx.offShow(this._runOnShowCallback);
        window.wx && wx.onShow(this._runOnShowCallback);

        this.autoPullAllConfig = autoPullAllConfig;
    },




    /**
     * public:
     */

    /**
     * sdk版本
     */
    version: '0.1.11',

    /**
     * 游戏ID与游戏版本
     */
    game_id: '',
    game_version: 1,

    /**
     * 拉取配置
     */
    pullCfg: true,
    lastPullTime: 0,

    _firstPull: false,

    get autoPullAllConfig() {
        return this._autoPullAllConfig;
    },
    set autoPullAllConfig(enable) {
        this.enablePullConfigOnShow(enable);
    },

    /**
     * 拉取配置使用CDN
     */
    configUseCdn: false,


    /**
     * 横幅广告ID
     */
    banner_ids: [],
    /**
     * 横幅广告ID索引
     */
    banner_index: 0,
    /**
     * 横幅广告预置调整位置方法
     */
    bannerMethod: {
        placedTop: onBannerPlacedTopDefault,
        placedBottom: onBannerPlacedBottomDefault,
        resizeTop: onBannerResizeTopDefault,
        resizeBottom: onBannerResizeBottomDefault,
    },
    /**
     * 横幅广告修改位置
     */
    onBannerPlaced: onBannerPlacedBottomDefault,
    /**
     * 横幅广告尺寸确认时调整位置
     */
    onBannerResize: onBannerResizeBottomDefault,


    /**
     * 激励广告ID
     */
    video_ids: [],
    /**
     * 激励广告ID索引
     */
    video_index: 0,

    /**
     * 下发的配置
     */
    conf: {
        share_flag: -1,
        invite_flag: -1,
        prize_flag: -1,
        banner_refresh_interval: -1, //横幅广告刷新间隔秒,<=0不刷新
    },

    /**
     * 内推广告
     */
    insideAds: {
        /**
         * 描述
         */
        desc: '内推广告',
        /**
         * 名称
         */
        name: 'get_list',
        /**
         * 内推网址
         */
        url: _INSIDE_ADS_URL,
        /**
         * 内推网址CDN版本
         */
        url_cdn: _INSIDE_ADS_CDN_URL,
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
        /**
         * 用户ID
         */
        user_id: '',
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
        /**
         * 名称
         */
        name: 'get_wall',
        /**
         * 试玩墙网址
         */
        url: _WALL_ADS_URL,
        /**
         * 试玩墙网址CDN版本
         */
        url_cdn: _WALL_ADS_CDN_URL,
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
        /**
         * 用户ID
         */
        user_id: '',
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
     * 系统配置
     */
    sys: {},

    pullMainConfig(onSuccess = null, onFail = null) {
        if(SDK.configUseCdn) {
            SDK._getRemoteConfigByCdn(onSuccess, onFail);
        } else {
            SDK._getRemoteConfig(onSuccess, onFail)
        }
        SDK._firstPull = true;
    },

    pullOtherConfig(filter = {
        inside: true,
        wall: true,
        share: true,
    }) {
        let defaultFilter = {
            inside: true,
            wall: true,
            share: true,
        };
        SDK.extend(defaultFilter, filter);
        filter = defaultFilter;
        //拉取内推广告
        filter.inside && SDK._getAds(SDK.insideAds);
        //拉取试玩墙
        filter.wall && SDK._getAds(SDK.wallAds);
        //拉取分享配置
        filter.share && SDK._getRemoteShareConfig();
    },

    enablePullConfigOnShow(enable) {
        this._autoPullAllConfig = enable;
        SDK.offShow('sdk');
        if (enable) {
            SDK.onShow('sdk', res => {
                //拉取配置
                let time = new Date().getTime() / 1000 - SDK.lastPullTime;
                if (SDK.pullCfg && time > SDK.autoPullInterval) {
                    SDK.lastPullTime = new Date().getTime() / 1000;
                    SDK.autoPullMainConfig && SDK.pullMainConfig();
                    SDK.pullOtherConfig({
                        inside: SDK.autoPullInsideAds,
                        wall: SDK.autoPullWallAds,
                        share: SDK.autoPullShare,
                    });
                } else {
                    //重置为true
                    SDK.pullCfg = true;
                }
            }, 0, !SDK._firstPull);
        }
    },



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
     * @param {number} imme 立即执行, 可用于模拟首次onShow回调
     */
    onShow: function (name, callback, order = 0, imme = false) {
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
        if(imme && window.wx && callback) {
            let launchOptions = wx.getLaunchOptionsSync();
            callback(launchOptions);
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
     * 启用分享, 未启用时只能主动调用share来分享, 没有系统菜单
     * @param {*} onSuccess 
     * @param {*} onFail 
     * @param {*} onComplete 
     */
    enableShare: function (onSuccess = null, onFail = null, onComplete = null) {
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
    onShare: function (title, imageUrl, query, onSuccess = null, onFail = null, onComplete = null) {
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
     * @param {*} onCancel 
     */
    share: function (title, imageUrl, query, onSuccess = null, onFail = null, onComplete = null, onCancel = null) {
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
            cancel: onCancel,
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
    subMsg: function (msg, onFail = null) {
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
    showToast: function (msg, duration = 1500, onSuccess = null, onFail = null, onComplete = null, image = null) {
        _log('SDK.showToast');
        if (!this._checkWx(onFail, onComplete)) {
            return;
        }
        wx.showToast({
            title: msg,
            icon: 'none',
            image: image || undefined,
            duration: duration || 1500,
            success: onSuccess,
            fail: onFail,
            complete: onComplete,
        });
    },

    showModal: function (title, content, onSuccess = null, onFail = null, onComplete = null) {
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

    openSetting(onSuccess = null, onFail = null, onComplete = null) {
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
    showLoading: function (msg, mask, onSuccess = null, onFail = null, onComplete = null) {
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
    hideLoading: function (onSuccess = null, onFail = null, onComplete = null) {
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
        _log('SDK.hasVideo');
        if (this._videoAd && this._videoAd.isReady) {
            return this._videoAd.isReady();
        }
        return this.video_ids.length > 0 && this._videoAd && this._rewardsAdLoaded;
    },

    /**
     * 显示视频广告
     * @param {*} onClose //视频看完关闭时的回调
     * @param {*} onFail //失败回调
     */
    showVideo: function (onClose = null, onFail = null) {
        _log('SDK.showVideo');
        if (this.video_ids.length > 0) {
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
     * 横幅广告定时刷新的定时器
     */
    _bannerTimer: 0,

    /**
     * 横幅广告是否可见
     */
    _bannerVisible: false,

    /**
     * 调用了showBanner后为true, 调用了hideBanner后为false
     */
    _bannerHasShow: false,

    /**
     * 显示横幅广告
     */
    showBanner: function () {
        _log('SDK.showBanner');
        this._bannerVisible = false;
        this._bannerHasShow = true;
        if (this.banner_ids.length > 0) {
            //定时加载显示广告
            let delayUpdateBanner = (delay) => {
                if (delay > 0) { //大于0才刷新
                    clearTimeout(this._bannerTimer);
                    this._bannerTimer = setTimeout(() => {
                        if (this._banner) {
                            _log('定时移除横幅广告');
                            this._banner.destroy();
                            this._banner = null;
                            this._bannerVisible = false;
                        }
                        _log('定时重新显示横幅广告');
                        this._bannerTimer = setTimeout(() => {
                            this.showBanner();
                        }, 60); //删除广告后, 延时1秒再尝试创建, 避免一个内部错误
                    }, delay * 1000);
                }
            }
            //成功显示后的处理
            let afterSuccess = () => {
                _log('横幅广告显示成功!');
                this._bannerVisible = true;
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
                });
            };

            clearTimeout(this._bannerTimer);
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
            _log('SDK.showBanner: 无横幅广告ID!');
        }
    },
    /**
     * 隐藏横幅广告
     */
    hideBanner: function () {
        _log('SDK.hideBanner');
        this._bannerVisible = false;
        this._bannerHasShow = false;
        if (this._banner) {
            this._banner.hide();
        }
        clearTimeout(this._bannerTimer);
        this._bannerTimer = 0;
    },
    /**
     * 移除横幅广告
     */
    removeBanner: function () {
        _log('SDK.removeBanner');
        this._bannerVisible = false;
        if (this._banner) {
            this._banner.destroy();
            this._banner = null;
        }
        if (this._bannerTimer) {
            clearTimeout(this._bannerTimer);
            this._bannerTimer = 0;
        }
    },

    /**
     * 展示图片
     */
    showImage: function (url, onSuccess = null, onFail = null, onComplete = null) {
        _log('SDK.showImage');
        if (!this._checkWx(onFail, onComplete)) {
            return;
        }
        wx.previewImage({
            current: url,
            urls: [url],
            success: (res) => {
                SDK.pullCfg = false; //不需要重新拉取广告
                onSuccess && onSuccess(res);
            },
            fail: onFail,
            complete: onComplete,
        })
    },

    /**
     * 显示内推广告
     */
    showInsideAds: function (obj, onSuccess = null, onFail = null, onComplete = null) {
        _log('SDK.showInsideAds, id:', obj.app_id, ' path:', obj.app_path);

        let app_id = obj.app_id;
        let app_path = obj.app_path;

        if (
            window.wx &&
            typeof wx.navigateToMiniProgram == 'function' &&
            obj.app_id
        ) {
            wx.navigateToMiniProgram({
                appId: obj.app_id,
                path: obj.app_path,
                extraData: '',
                success: (res) => {
                    _log('跳转至小程序成功: ', res);
                    onSuccess && onSuccess(res);
                },
                fail: res => {
                    _log('跳转至小程序失败: ', res);
                    onFail && onFail();
                },
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

        this.request({
            url: _SHARE_STAT_URL,
            data: {
                position_id: position_id,
                share_id: share_id,
                self: self,
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
        if (!window.wx) {
            return;
        }
        Promise.all([
            this.promisify(wx.getBatteryInfo),
            this.promisify(wx.getNetworkType),
        ]).then(arr => {
            let sys = this.sys || {};
            let data = {
                "sdk_version": sys.SDKVersion,
                "version": sys.version,
                "model": sys.model,
                "system": sys.system,
                "battery_level": arr[0].level,
                "network_type": arr[1].networkType,
                "game_id": this.game_id,
                "tag": tag,
                "code": code,
                "time_used": time_used,
            };
            _log('准备上报请求时间: ', data);
            this.request({
                url: _REPORT_TIME_URL,
                data: {
                    data: JSON.stringify(data),
                },
                success: res => {
                    _log('上报请求时间成功: ', res);
                },
                fail: res => {
                    _log('上报请求时间失败: ', res);
                }
            });
        });
    },

    reportAdsClick(page, id) {
        if (!_REPORT_ADS_CLICK_URL || !window.wx) {
            return;
        }
        const name = 'report_click';
        this.getUserIdOrCode(name, obj => {
            obj.page = page;
            obj.tag = id;
            let launchOptions = wx.getLaunchOptionsSync();
            obj.reserve = launchOptions.query ? (launchOptions.query.agent || 'official') : 'official';
            this.request({
                url: _REPORT_ADS_CLICK_URL,
                data: obj,
                success: res => {
                    this.saveUserId(name, res);
                    _log(`上报点击[${page}, ${id}]成功: `, res);
                },
                fail: res => {
                    _log(`上报点击[${page}, ${id}]失败: `, res);
                },
            })
        })
    },

    promisify(methodName, object = {}) {
        let method = methodName;
        if (typeof methodName == 'string') {
            if (!window.wx || !window.wx[methodName]) {
                return Promise.reject({
                    errMsg: `[SDK.promisify]失败: 方法${methodName}在当前微信版本不存在!`,
                })
            }
            method = window.wx[methodName];
        }
        if (!method) {
            return Promise.reject({
                errMsg: '[SDK.promisify]失败: 方法在当前微信版本不存在!',
            })
        }
        return new Promise((resolve, reject) => {
            object.success = res => resolve(res);
            object.fail = res => reject(res);
            method(object);
        });
    },

    setStorage(key, value) {
        let str = JSON.stringify({
            v: value,
        });
        if (window.wx) {
            wx.setStorage({
                key: key,
                data: str,
            })
        } else if (window.localStorage) {
            window.localStorage.setItem(key, str);
        }
    },
    getStorageSync(key) {
        let str = '',
            ret = null;
        if (window.wx) {
            str = wx.getStorageSync(key);
        } else if (window.localStorage) {
            str = window.localStorage.getItem(key);
        }
        try {
            ret = JSON.parse(str).v;
        } catch (error) {
            ret = null;
        }
        return ret;
    },
    getStorage(key, func) {
        if (window.wx) {
            func && wx.getStorage({
                key: key,
                success: res => {
                    let ret = null;
                    try {
                        ret = JSON.parse(res.data).v;
                    } catch (error) {
                        ret = null;
                    }
                    func(ret);
                },
                fail: res => {
                    func(null);
                },
            });
        } else if (window.localStorage) {
            func && func(this.getStorageSync(key));
        } else {
            func && func(null);
        }
    },

    _getUserIdKey(name) {
        return 'wx_uid_' + name;
    },

    getSavedUserId(name) {
        return this.getStorageSync(this._getUserIdKey(name)) || '';
    },

    /**
     * 从微信获取code
     */
    getUserCode(onSuccess = null, onFail = null) {
        if(!this._checkWx(onFail, null, 'login')) {
            return;
        }
        
        wx.login({
            success: res => {
                _log('请求登录微信成功: ', res);
                let code = res.code;
                onSuccess && onSuccess({
                    code: code,
                })
            },
            fail: res => {
                _log("请求登录微信失败: ", res);
                onFail && onFail(res);
            },
        });
    },

    /**
     * 获取用户ID, 不存在或超时, 重新登录微信获取code
     * @param {*} name 
     */
    getUserIdOrCode(name, onSuccess = null, onFail = null) {
        if(!this._checkWx(onFail, null, 'checkSession')) {
            return;
        }
        this.getStorage(this._getUserIdKey(name), user_id => {
            if (user_id) {
                wx.checkSession({
                    success: res => {
                        _log('登录未超时, 使用本地user_id');
                        onSuccess && onSuccess({
                            user_id: user_id
                        });
                    },
                    fail: res => {
                        _log('登录超时, 重新微信登录: ', res);
                        this.getUserCode(onSuccess, onFail);
                    },
                });
            } else {
                _log('本地无user_id, 使用微信登录获取code');
                this.getUserCode(onSuccess, onFail);
            }
        });
    },

    saveUserId(name, res) {
        if (res && res.data && res.data.user_id) {
            this.setStorage(this._getUserIdKey(name), res.data.user_id);
        }
    },

    request(obj = {
        url,
        data,
        success,
        fail,
        complete
    }) {
        if(!this._checkWx(obj.fail, obj.complete, 'request')) {
            return;
        }
        !obj.data && (obj.data = {});
        !obj.data.game_id && (obj.data.game_id = this.game_id);
        !obj.data.version && (obj.data.version = this.game_version);
        !obj.method && (obj.method = 'POST');
        !obj.header && (obj.header = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        });
        _log('发送网络请求: ', obj);
        wx.request(obj);
    },

    getAddons(cid = true, agent = true, os = true, out = {}) {
        let data = out || {};
        if(!this._checkWx(null, null, 'getLaunchOptionsSync')) {
            return data;
        }
        let launchOptions = wx.getLaunchOptionsSync();
        if (cid) {
            data.cid = (launchOptions.query && launchOptions.query.cid) ? launchOptions.query.cid : '';
        }
        if (agent) {
            data.agent = (launchOptions.query && launchOptions.query.agent) ? launchOptions.query.agent : 'official';
        }
        if (os && SDK.sys && SDK.sys.platform && typeof SDK.sys.platform == 'string') {
            data.os = SDK.sys.platform.toLowerCase();
            if (data.os != 'android' && data.os != 'ios') {
                data.os = 'android';
            }
        }
        return data;
    },

    getDataFromRes(res) {
        if (res && res.statusCode == 200 && res.data) {
            let data = res.data;
            if (typeof res.data == 'string') {
                try {
                    data = JSON.parse(res.data);
                } catch (error) {
                    data = res.data;
                }
            }
            return data;
        }
        return null;
    },

    isPlainObject(obj) {
        return typeof obj === 'object' && (!obj.constructor || obj.constructor.prototype === Object.prototype);
    },
    extend: function () {
        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        if (typeof target === "boolean") {
            deep = target;
            target = arguments[1] || {};
            i = 2;
        }

        if (typeof target !== "object" && typeof (target) !== 'function') {
            target = {};
        }

        if (length === i) {
            target = this;
            --i;
        }

        for (; i < length; i++) {
            if ((options = arguments[i]) != null) {
                for (name in options) {
                    src = target[name];
                    copy = options[name];

                    if (target === copy) {
                        continue;
                    }

                    if (deep && copy && (SDK.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && Array.isArray(src) ? src : [];
                        } else {
                            clone = src && SDK.isPlainObject(src) ? src : {};
                        }

                        target[name] = SDK.extend(deep, clone, copy);

                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }


        return target;
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
    _checkWx: function (onFail = null, onComplete = null, methodName = null) {
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
        if (Array.isArray(data)) {
            return data;
        }
        let ret = [];
        if (data instanceof Object) {
            for (let i in data) {
                ret.push({
                    'key': i,
                    'value': data[i] + '',
                });
            }
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
     * onShow回调相关
     */
    _onShowList: [],
    _runOnShowCallback(res) {
        _log('_runOnShowCallback: ', res);

        SDK._onShowList.sort((a, b) => b.order - a.order);
        const copy = SDK._onShowList.slice(0);
        copy.forEach(obj => {
            obj && obj.callback && obj.callback(res);
        })
    },

    _getRemoteConfigByCdn(onSuccess = null, onFail = null, onComplete = null) {
        if(!this._checkWx(onFail, onComplete, 'request')) {
            return;
        }

        let start = new Date().getTime();

        wx.request({
            url: _CONFIG_CDN_URL + this.game_id + '.json?t=' + new Date().getTime(),
            method: 'GET',
            header: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            success: res => {
                
                //报告访问时长
                let end = new Date().getTime();
                this.needReportTime && this.reportTime('conf', 0, end - start);

                let data = this.getDataFromRes(res);
                //配置为空
                if (!data) {
                    _log('[拉取配置CDN]配置为空');
                }
                //审核版本
                else if(data.verify_version == this.game_version) {
                    _log('[拉取配置CDN]为审核版本');
                }
                //成功
                else {
                    _log('[拉取配置CDN]成功: ', res);
    
                    //应用配置
                    this.conf = data.game_config || {};
    
                    //应用渠道配置
                    this._processConfigForChannel(data.channel_config);
    
                    //应用广告配置
                    this._processAdsFromConf();

                    //回调
                    this.onRemoteLoaded && this.onRemoteLoaded(this.conf);
                }

                //回调
                onSuccess && onSuccess(res);
            },
            fail: res => {

                //报告访问时长
                let end = new Date().getTime();
                this.needReportTime && this.reportTime('conf', 1, end - start);

                _log('[拉取配置CDN]失败: ', res);
                onFail && onFail(res);
            },
            complete: onComplete,
        })
    },

    _processConfigForChannel(channel_config) {
        if(!channel_config || !Array.isArray(channel_config)) {
            _log('[拉取配置CDN]渠道配置不存在');
            return;
        }
        let launchOptions = wx.getLaunchOptionsSync();
        let cid = (launchOptions.query && launchOptions.query.cid) ? launchOptions.query.cid : '';
        let index = channel_config.findIndex(o => o.cid == cid);
        if(index == -1) {
            _log('[拉取配置CDN]渠道配置不包含当前渠道: ', cid);
            return;            
        }
        let conf = this.queryToObject(channel_config[index].conf);
        _log('[拉取配置CDN]当前渠道配置: ', conf);
        this.extend(this.conf, conf);
    },

    queryToObject(url = '') {
        let _pa = url.substring(url.indexOf('?') + 1), _arrS = _pa.split('&'), _rs = {};
        for (let i = 0, _len = _arrS.length; i < _len; i++) {
            let pos = _arrS[i].indexOf('=');
            if (pos == -1) {
                continue;
            }
            let name = _arrS[i].substring(0, pos), value = window.decodeURIComponent(_arrS[i].substring(pos + 1));
            _rs[name] = value;
        }
        return _rs;
    },

    /**
     * 拉取广告及其它配置
     */
    _getRemoteConfig(onSuccess = null, onFail = null, onComplete = null) {
        let data = this.getAddons(true, false, true);

        let start = new Date().getTime();

        this.request({
            url: _CONFIG_URL,
            data: data,
            success: res => {

                let end = new Date().getTime();
                this.needReportTime && this.reportTime('conf', 0, end - start);

                let data = this.getDataFromRes(res);
                if (data && data.code == 0 && data.conf) {
                    this.conf = data.conf;

                    this._processAdsFromConf();

                    _log('远程拉取配置成功: ', res);

                    SDK.onRemoteLoaded && SDK.onRemoteLoaded(this.conf);
                    
                } else {
                    _log('远程拉取配置成功(但code!=0或conf不存在): ', res);
                }
                
                onSuccess && onSuccess(res);
            },
            fail: res => {
                let end = new Date().getTime();
                this.needReportTime && this.reportTime('conf', 1, end - start);

                _log('远程拉取配置失败: ', res);
                onFail && onFail(res);
            },
            complete: onComplete,
        });
    },

    _processAdsFromConf() {
        //添加视频ID, 若未加载视频广告, 则重新加载
        if (this.conf.video_ids || this.conf.video_id) {
            SDK._addVideoId(this.conf.video_ids || this.conf.video_id);
            if (SDK.video_ids.length > 0 && !SDK.hasVideo()) {
                SDK._loadRewardedVideoAd();
            }
        }
        //添加横幅ID, 原为显示状态但未显示, 则重新尝试显示
        if (this.conf.banner_ids || this.conf.banner_id) {
            SDK._addBannerId(this.conf.banner_ids || this.conf.banner_id);
            if (
                SDK.banner_ids.length > 0 &&
                !SDK._bannerVisible &&
                SDK._bannerHasShow
            ) {
                SDK.showBanner();
            }
        }
    },

    /**
     * 远程拉取分享标题图片配置
     */
    _shareConfig: null,
    _getRemoteShareConfig: function () {

        this.request({
            url: _SHARE_URL,
            success: res => {
                let data = this.getDataFromRes(res);

                //成功获取
                if (data.code == 0 && Array.isArray(data.share)) {
                    _log('远程拉取分享配置成功: ', data);
                    this._shareConfig = data.share;
                    this._loadShareImage();
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
            if (logs.length >= arr.length) {
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
                if(this.sys.platform == 'devtools') {
                    obj.share_pic_local = obj.share_pic;
                    this._downloadedFiles.push({
                        url: obj.share_pic,
                        file: obj.share_pic,
                    });
                    addLog('下载文件成功:', obj);
                    return;
                }
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

    _getAds(ads) {
        if(this.configUseCdn) {
            this._getAdsCdn(ads);
        } else {
            this._getAdsNormal(ads);
        }
    },

    _getAdsCdn(ads) {
        if(!this._checkWx(null, null, 'request')) {
            return;
        }
        wx.request({
            url: ads.url_cdn + this.game_id + '.json?t=' + new Date().getTime(),
            method: 'GET',
            header: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            success: res => {
                let data = this.getDataFromRes(res);
                //为空
                if(!data) {
                    _log(`[拉取${ads.desc}CDN]为空`);
                }
                //审核版本
                else if(data.verify_version == this.game_version) {
                    _log(`[拉取${ads.desc}CDN]为审核版本`);
                }
                //成功
                else {
                    _log(`[拉取${ads.desc}CDN]成功: `, data);

                    //检查渠道
                    if(data.mask_channel) {
                        let launchOptions = wx.getLaunchOptionsSync();
                        let cid = (launchOptions.query && launchOptions.query.cid) ? launchOptions.query.cid : 'self';
                        let arr = data.mask_channel.split(',');
                        let index = arr.indexOf(cid);
                        if(index > -1) {
                            _log(`[拉取${ads.desc}CDN]为屏蔽渠道: `, cid);
                            ads.list = [];
                            ads.conf = {};
                            ads.onChanged && ads.onChanged(ads);
                            return;
                        }
                    }

                    //下发的列表
                    ads.list = Array.isArray(data.list) ? data.list : [];
                    //随机顺序
                    if(data.random_flag == 1) {
                        this._shuffle(ads.list);
                    }

                    //下发的配置
                    ads.conf = data.game_config || {};

                    //回调
                    ads.onChanged && ads.onChanged(ads);
                }
            },
            fail: res => {
                _log(`远程拉取${ads.desc}失败: `, res);
            },
        });
    },

    _getAdsNormal: function (ads) {
        if (!ads.url) {
            return;
        }
        this.getUserIdOrCode(ads.name, obj => {
            let data = this.getAddons(false, true, true, obj);
            this.request({
                url: ads.url,
                data: data,
                success: (res) => {
                    let data = this.getDataFromRes(res);
                    if (data && data.code == 0) {
                        this.saveUserId(ads.name, res);
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
        }, res => {
            _log(`远程拉取${ads.desc}失败: `, res);
        })
    },


    /**
     * 创建横幅
     */
    _bannerResetPosition: false,
    _createBannerAd: function (onLoad, onError) {
        _log('SDK._createBannerAd');
        if (!this._checkWx(null, null, 'createBannerAd')) {
            _log('微信版本不支持横幅广告!');
            return;
        }
        if (this.banner_ids.length == 0) {
            _log('SDK._createBannerAd: 无横幅广告ID');
            return;
        }
        //销毁已有广告
        if (this._banner) {
            this._banner.destroy();
            this._banner = null;
        }

        //横幅广告不再切换ID
        // this.banner_index = (this.banner_index + 1) % this.banner_ids.length;
        let id = this.banner_ids[this.banner_index];
        _log(`创建横幅广告(${this.banner_index}): ${id}`);

        const screenWidth = this.sys.screenWidth;
        const screenHeight = this.sys.screenHeight;
        const width = 300;
        this._bannerResetPosition = false;
        this._banner = wx.createBannerAd({
            adUnitId: id,
            style: this.onBannerPlaced(screenWidth, screenHeight, width),
        })
        //用于固定位置动态调整
        this._banner.onResize && this._banner.onResize((res) => {
            //避免循环调整尺寸
            if (!this._bannerResetPosition) {

                let pos = this.onBannerResize(screenWidth, screenHeight, res.width, res.height, this._banner.style.top, this._banner.style.left);
                (this._banner.style.top != pos.top) && (this._banner.style.top = pos.top);
                (this._banner.style.left != pos.left) && (this._banner.style.left = pos.left);

                this._bannerResetPosition = true;
            }
            // _log('横幅广告调整尺寸: ', res);
            // _log('横幅广告样式: ', this._banner.style);
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
        let id = this.video_ids[this.video_index];
        //创建广告 //创建时会自动拉取广告, 不需要手动load
        _log(`创建视频广告(${this.video_index}): ${id}`);
        this._videoAd = wx.createRewardedVideoAd({
            adUnitId: id
        });
        _log('视频广告已创建: ', this._videoAd);
        //手动load
        // this._videoAd.load();
        //绑定事件
        this._bindVideoEvent();
    },
    _bindVideoEvent() {
        if(this._rewardsAdEventBind) {
            return;
        }
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
            this.video_index += 1;
            if (this.video_index < 15) {
                let id = this.video_ids[this.video_index % this.video_ids.length];
                _log(`重新加载视频广告(${this.video_index}): ${id}`);
                this._videoAd = wx.createRewardedVideoAd({
                    adUnitId: id
                });
            }
        })
        this._rewardsAdEventBind = true;
    },

    _addBannerId: function (str) {
        this._mergeAdsId(this.banner_ids, str, `banner_index`);
    },

    _addVideoId: function (str) {
        this._mergeAdsId(this.video_ids, str, 'video_index');
    },
    _mergeAdsId: function (ids, str, indexName) {
        _log('SDK._mergeAdsId: ', str);
        _log(`添加广告ID前: ids(${ids}), ${indexName}(${this[indexName]})`);

        let oldLen = ids.length;
        //分隔字串, 去掉空字符串
        let arr = (str + '').split(',').filter(o => o);
        //为空返回
        if (arr.length > 0) {
            //去掉前后空字符
            arr = arr.map(o => o.trim ? o.trim() : o);
            //合并
            arr.forEach(o => ids.push(o));
            //去重复, 尽量保持原顺序
            for (let i = ids.length - 1; i >= 0; --i) {
                for (let j = i - 1; j >= 0; --j) {
                    if (!ids[i] || ids[i] == ids[j]) {
                        ids.splice(i, 1);
                        break;
                    }
                }
            }
        }
        let newLen = ids.length;
        if (newLen > oldLen) {
            this[indexName] %= newLen;
        }
        _log(`添加广告ID前: ids(${ids}), ${indexName}(${this[indexName]})`);
    },

    //乱序
    _shuffle: function (array) {
        var ci = array.length,
            t, ri;
        while (0 !== ci) {
            ri = Math.floor(Math.random() * ci);
            ci -= 1;
            t = array[ci];
            array[ci] = array[ri];
            array[ri] = t;
        }
        return array;
    }
};
/**
 * SDK结束
 */

if (typeof module != 'undefined') module.exports = SDK;
window.SDK = SDK;





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


//用于重写log
const originLogger = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    debug: console.debug,
}
const wxLogger = (window.wx && typeof wx.getLogManager == 'function') ? wx.getLogManager() : null;

function setSaveLog(saveLog) {
    if (saveLog && wxLogger) {
        console.log = function () {
            originLogger.log.apply(console, arguments);
            wxLogger.log.apply(wxLogger, arguments);
        }
        console.info = function () {
            originLogger.info.apply(console, arguments);
            wxLogger.info.apply(wxLogger, arguments);
        }
        console.warn = function () {
            originLogger.warn.apply(console, arguments);
            wxLogger.warn.apply(wxLogger, arguments);
        }
        console.debug = function () {
            originLogger.debug.apply(console, arguments);
            wxLogger.debug.apply(wxLogger, arguments);
        }
    } else {
        console.log = originLogger.log;
        console.info = originLogger.info;
        console.warn = originLogger.warn;
        console.debug = originLogger.debug;
    }
}

function onBannerPlacedTopDefault(screenWidth, screenHeight, width) {
    return {
        width: width,
        top: 0,
        left: (screenWidth - width) * .5,
    }
}

function onBannerPlacedBottomDefault(screenWidth, screenHeight, width) {
    return {
        width: width,
        top: screenHeight - 104,
        left: (screenWidth - width) * .5,
    }
}

function onBannerResizeTopDefault(screenWidth, screenHeight, width, height, top, left) {
    return {
        top: 0,
        left: left,
    }
}

function onBannerResizeBottomDefault(screenWidth, screenHeight, width, height, top, left) {
    return {
        top: screenHeight - height,
        left: left,
    }
}
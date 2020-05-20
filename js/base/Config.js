export default class Config{
}

Config.sys = wx.getSystemInfoSync();
Config.isIPhone = Config.sys.platform == 'ios';
Config.isIPhoneX = !!Config.sys.model.match('iPhone X');

//屏幕尺寸
Config.sWidth = Config.sys.screenWidth;
Config.sHeight = Config.sys.screenHeight;

//设计尺寸
Config.designWidth = 720;
Config.designHeight = 1280;

//可视尺寸
Config.vWidth = Config.designWidth;
Config.vHeight = Config.vWidth / Config.sWidth * Config.sHeight;


//长按时自动开始桥的增长
Config.pressToGrowBridge = true;

//模型版本, 主要用于检测是否需要解压
//取消解压功能, 用于服务器下载资源
Config.modelVersion = 1;

//模型远程下载地址
Config.modelRemoteUrl = 'https://imgcache.xiaoyouxiqun.com/game_general/bridge01';

//镜头纵向偏移(为0.5时, 主角位于画面中心, 为1时, 主角位于画面下方)
Config.cameraVOffset = 0.618;

//镜头移动时间
Config.cameraMoveDuration = 0.45;

//主角转弯时间
Config.heroTurnDuration = 0.2;

//主角移动速度
Config.heroMoveSpeed = 13;

//主角缩放
Config.heroZoom = 3;

//宠物缩放
Config.petZoom = 1.5;

//宠物转弯时间
Config.petTurnDuration = 0.3;

//宠物移动速度
Config.petMoveSpeed = 11.5;

//宠物出现时间
Config.appearDuration = 0.5;

//宠物移动间隔(比前一个宠物开始移动慢一拍)
Config.petMoveInterval = 0.15;

//宠物间距
Config.petSpacing = 3;

//底座高
Config.platformHeight = 20;

//底座宽 //未使用, 目前用靶宽来计算底座宽
// Config.platformWidthList = [46, 34, 25];

//底座移动速度
Config.platformMoveSpeed = 32;

//底座间隔 小值
Config.platformSpacingMin = 12;

//底座间隔 大值
Config.platformSpacingMax = 25;

//底座隐藏范围(距当前底座一定范围外的底座会被隐藏)
Config.platformHideRange = 6;

//底座上靶的宽度
Config.targetWidth = 0.8;

//桥宽
Config.bridgeWidth = 1.8;

//桥厚度
Config.bridgeThick = 0.2;

//桥最大长度
Config.bridgeMaxLen = 40;

//桥生长速度
Config.bridgeGrowSpeed = 20;

//桥位置到底座的偏移
Config.bridgePosOffset = 0.5;

//桥倒下动作持续时间
Config.bridgeFallDuration = 0.3;

//桥坠落动作持续时间
Config.bridgeDropDuration = 0.8;

//桥的线框提示显示次数
Config.bridgeTipsTimes = 3;


//方向, 用于桥的朝向/倒向, 主角/宠物的朝向和走向, 底座上靶贴图朝向
Config.Direction = {
    Left: 0,
    Right: 1,
}



//每局允许复活次数
Config.maxReviveTimes = 1;

//每天最多分享次数
Config.maxShareTimes = 6;

//道具最大数量
Config.maxItemCount = 5;

//道具分享超时时间(小时)
Config.itemShareTimeout = 24;

//复活重置速度
Config.isReviveResetVelocity = true;



//主页标题移动时间
Config.mainTitleMoveDuration = 0.5;

//主页UI渐显时间
Config.mainUiFadeDuration = 0.5;
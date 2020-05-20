import SoundMgr from '../mgr/SoundMgr'
import Config from '../base/Config'
import DataBus from '../runtime/DataBus';

//相同的种子, 获得的随机数序列也是相同的
class FixRand {
    //据种子获得一个随机数, 种子相同得到的随机数也相同
    static randBySeed(seed) {
        let old = this.seed;
        this.srand(seed);
        this.rand();
        this.rand();
        let ret = this.rand();
        this.srand(old);
        return ret;
    }

    //获取一个[0, 1)范围随机浮点数
    static rand() {
        // this.seed = (this.seed * 9301 + 49297) % 233280;
        this.seed = (this.seed * 214013 + 2531011) % 4294967296;
        return this.seed / 4294967296;
    }

    //获取一个[a, b]范围随机整数
    static randInt(a, b) {
        return Math.floor(this.rand() * (b - a + 1) + a);
    }

    //设置种子
    static srand(seed) {
        this.seed = parseInt(seed) || 0;
    }

}
FixRand.seed = 0;

export default class LevelMgr {

    //设置模式, 闯关或挑战
    static setLevelMode(mode) {
        this._levelMode = mode;
    }


    //据关卡序号获取一关
    //关卡序号超出范围, 随机获取一关(相同序号随机到的数据是相同的)
    static getLevelData(lvl) {
        if (this._levelMode == LevelMgr.LevelMode.Battle) {
            return this.getBattleData(lvl);
        }

        let len = this.getLevelsLength();
        let realLvl = (lvl >= len) ? Math.floor(FixRand.randBySeed(lvl) * len) : lvl;
        let obj = this._levelDataList[realLvl];
        if (obj && !obj.data) {
            this.initLevelData(obj, realLvl, obj.count);
        }
        return obj;
    }

    //挑战关卡序号
    static getBattleData(lvl) {

        lvl = lvl % this._petList.length;
        let obj = this._petList[lvl];
        if (obj && !obj.data) {
            let len = SoundMgr.instance.getMusicTonesLength(obj.name);
            this.initLevelData(obj, lvl, len);
        }
        return obj;
    }

    static getPetData(lvl) {
        let len = this.getPetsLength();
        lvl = Math.min(len - 1, Math.max(0, lvl));
        return this._petList[lvl];
    }

    static getPetsLength() {
        return this._petList.length;
    }

    //据关卡序号, 音符序号, 获取底座配置(尺寸, 距离)
    static getPlatformParam(lvl, index) {
        if (lvl < 0 || index < 0) {
            return {
                size: 2,
                dis: 10,
            }
        }
        let obj = this.getLevelData(lvl);
        return obj.data[index];
    }

    //返回底座模型
    static getPlatformModel() {
        let len = this._platformModelList.length;
        let i = Math.floor(Math.random() * len);
        return this._platformModelList[i];
    }
    static getPlatformModelList() {
        return this._platformModelList;
    }


    //播放一个音符
    static playMusicTone(lvl, index) {
        let obj = this.getPetData(lvl);
        let name = obj.name;
        SoundMgr.instance.playMusicTone(name, index);
    }

    //播放一首音乐
    static playMusic(lvl) {
        let obj = this.getPetData(lvl);
        let name = obj.name;
        SoundMgr.instance.playMusic(name);
    }

    //据关卡序号, 音符序号, 获取下一音符的关卡序号/音符序号
    //当音符序号走到当前关卡最后一个音符时, 关卡序号+1
    //关卡序号即使超出关卡范围也可以+1
    static getNextLevelIndex(lvl, index) {
        let ret = {
            lvl: lvl,
            index: index + 1,
            levelUp: false,
            hasPet: false,
            gotPet: false,
            petIndex: -1,
        }
        let len = lvl < 0 ? 0 : (this._levelMode == LevelMgr.LevelMode.Battle) ?
            this.getBattleData(lvl).data.length :
            this.getLevelData(lvl).data.length;
        if (index < 0 || ret.index >= len) {
            ret.lvl = Math.max(0, lvl + 1);
            ret.index = 0;
            ret.levelUp = (lvl >= 0) && (index >= 0);
            //这个位置应该有宠物
            ret.hasPet = (
                ret.levelUp &&
                lvl >= 0 &&
                lvl < this.getPetsLength()
            );
            //这个宠物有没有得到过
            if (this._levelMode == LevelMgr.LevelMode.Battle) {
                ret.gotPet = (DataBus.petList.indexOf(lvl) >= 0);
            } else {
                ret.gotPet = DataBus.levelRecord >= lvl;
            }
        }
        return ret;
    }

    //获取下一个宠物的距离(还差几个底座能看见下一个宠物)
    static getNextPetDistance(lvl, index) {
        let len = 0;
        if(this._levelMode == LevelMgr.LevelMode.Battle) {
            if(index < 0 || lvl < 0) {
                return -1;
            }
            if (DataBus.petList.indexOf(lvl) >= 0) {
                return -1;
            }
            len = this.getBattleData(lvl).data.length;
        } else {
            if(index < 0 || lvl < 0) {
                return -1;
            }
            if (DataBus.levelRecord >= lvl) {
                return -1;
            }
            len = this.getLevelData(lvl).data.length;
        }
        let ret = len - index;
        return (ret > 0 && len > 0 && (ret / len <= 0.5)) ? ret : -1;
    }

    //计算获得的宠物的序号
    static calcPetIndex(lvl) {
        if (this._levelMode == LevelMgr.LevelMode.Battle) {
            return lvl;
        } else {

            //此关已过, 不再获得宠物
            if (DataBus.levelRecord >= lvl) {
                return -1;
            }

            //宠物列表增加序号
            this._petList.forEach((obj, i) => {
                obj.i = i;
            })

            //未得到宠物的列表
            let arr = this._petList.filter((obj, i) => {
                return DataBus.petList.indexOf(i) == -1;
            })
            if (arr.length == 0) {
                return -1;
            }

            //未得到宠物总权重值
            let total = 0;
            arr.forEach(obj => {
                total += obj.weight;
            })

            //随机值
            let rnd = Math.random() * total;

            //查找随机值对应位置
            let sum = 0;
            for (let i = 0, len = arr.length; i < len; ++i) {
                sum += arr[i].weight;
                if (sum > rnd) {
                    console.log(`随机宠物: 当前权重和:${
                        total
                    }, 当前权重:${
                        arr[i].weight
                    }, 当前宠物:${
                        arr[i].i
                    }`)
                    return arr[i].i;
                }
            }


            //防止意外
            return arr[0].i;
        }
    }

    //获取关卡数量
    static getLevelsLength() {
        return this._levelDataList.length;
    }

    //据序号初始化一个关卡的底座数据(尺寸, 距离)
    static initLevelData(obj, seed, len) {
        if (obj && !obj.data) {
            obj.data = [];
            //用于实现连续3-5个小台子
            this._continueCount = 0;
            //设置随机种子
            FixRand.srand(seed);
            //遍历此关数量
            for (let i = 0; i < len; ++i) {
                let param = null;
                let percent = i / len * 100;

                //测试, 大小交替
                // if( i % 2 == 1) {
                //     param = this._createParam(0.8, 0.2, 0, 0, 1, 0, 0);
                // } else {
                //     param = this._createParam(0, 0.2, 0.8, 0, 1, 0, 0);
                // }
                // obj.data.push(param);
                // continue;

                //前15%的台子, 仅出现大型台子和短距离障碍
                if (percent < 15) {
                    //80%大台子, 20%中台子
                    //50%近距离, 50%中距离
                    param = this._createParam(0.8, 0.2, 0, 0, 0.5, 0.5, 0);
                }
                //中期16%-50%的台子, 
                else if (percent < 50) {
                    //40%大台子, 30%中台子, 20%小台子, 10%连续3-5个小台子
                    //10%近距离, 70%中距离, 20%长距离
                    param = this._createParam(0.4, 0.3, 0.2, 0.1, 0.1, 0.7, 0.2);
                }
                //后期50%-90%的台子
                else if (percent < 90) {
                    //10%大台子, 40%中台子, 30%小台子, 20%连续3-5个小台子
                    //5%近距离, 55%中距离, 30%长距离, 10%超远距离
                    param = this._createParam(0.1, 0.4, 0.3, 0.2, 0.05, 0.55, 0.3, 0.1);
                }
                //末期90%-98%的台子
                else if (percent < 98) {
                    //0%大台子, 40%中台子, 40%小台子, 20%连续3-5个小台子
                    //0%近距离, 20%中距离, 40%长距离, 40%超远距离
                    param = this._createParam(0, 0.4, 0.4, 0.2, 0, 0.2, 0.4, 0.4);
                }
                //98%-100%的台子
                else {
                    //0%大台子, 40%中台子, 40%小台子, 20%连续3-5个小台子
                    //0%近距离, 15%中距离, 25%长距离, 60%超远距离
                    param = this._createParam(0, 0.4, 0.4, 0.2, 0, 0.15, 0.25, 0.6);
                }
                obj.data.push(param);
            }
        }

    }

    //根据几率生成底座配置(尺寸, 距离)
    static _createParam(s1, s2, s3, s4, d1, d2, d3, d4 = 0) {
        let param = {
            size: 2,
            dis: 10,
            far: false,
        };
        if (this._continueCount > 0) {
            param.size = 0;
            --this._continueCount;
        } else {
            let rnd = FixRand.rand();
            if (rnd >= s1 + s2 + s3) {
                param.size = 0;
                this._continueCount = FixRand.randInt(2, 4);
            } else {
                param.size = (rnd < s1) ? 2 : (rnd < s1 + s2) ? 1 : 0;
            }
        }

        let rnd = FixRand.rand();
        let disFlag = (rnd < d1) ? 0 : (rnd < d1 + d2) ? 1 : (rnd < d1 + d2 + d3) ? 2 : 4;
        let min = Config.platformSpacingMin;
        let max = Config.platformSpacingMax;
        let seg = (max - min) / 3;
        let dis = min + seg * disFlag + seg * FixRand.rand();
        param.dis = dis;
        param.far = (disFlag > 2);

        return param;
    }


}

//用于实现连续3-5个小台子
LevelMgr._continueCount = 0;

//关卡音乐数据
LevelMgr._petList = [
    // {
    //     name: 'girl',
    //     title: 'that_girl',
    //     petName: '喵大人',
    //     pet: 'cat',
    //     music: 'C#;89;611,711,120.',
    // },
    {
        name: 'bird',
        title: '鸟之诗',
        petName: '小狐狸',
        pet: 'fox',
        weight: 300,
        music: 'D;120;020,021,610,711,121,521,320,321,222,320,020,022,020,221,321,521,121,711,121,710,711,612,310,020,022,020,021,610,711,121,521,320,321,222,320,020,022,020,221,321,521,321,521,131,721.,622,021,320,021,021,221,320,520,620,720,320,321,222,320,020,022,020,221,321,521,121,711,121,710,711,612,310,020,022,020,021,610,711,121,521,320,321,222,320,020,022,020,221,321,521,321,521,131,720,020,020,021,621,620,020,020,620,720,020,020,021,621,620,020,020,020', //
    },
    {
        name: 'light',
        title: '追光者',
        petName: '圆圆',
        pet: 'panda',
        weight: 300,
        music: `C;72;531,631,731,241,142,332,332,531,532,531,631,332,232,131,231,132,232,232,531,332,331,022,532,632,731.,241,142,332,332,531,532,531,631,231,131,231,132,722,722,131,132,131,531,631,731,241,142,332,332,531,532,531,631,231,131,231,132,232,232,531.,331,022,532,632,731.,241,142,332,332,531,532,530,331,531,530,020,432,331,232,231,131`,
    },
    {
        name: 'planet',
        title: 'Planet',
        petName: '长颈鹿',
        pet: 'giraffe',
        weight: 250,
        music: `E;106;131,721,621,521,620,520,220,521,321,320,020,131,721,621,521,620,231,331,621,621,520,620,020,131,721,621,521,620,521,521,220,521,321,320,020,131,721,621,521,620,231,331,231,131,130,130,020,130.,231,130.,131,721,621,720,131,521,520,130.,231,130.,131,721,621,720,130,020,130.,231,130.,131,721,621,720,131,521,520,130.,231,130.,131,721,621,720,130,020`,
    },
    {
        name: 'cat',
        title: '学猫叫',
        petName: '喵大人',
        pet: 'cat',
        weight: 200,
        music: `F#;115;020,020,020,131,231,331,521,131,331,330,231,131,231,531,531,531,530,131,721,131,131,131,131,130,721,131,721,131,721,621,520,521,521,621,621,621,621,620,521,321,521,321,521,231,130.,521,331,331,331,431,531,131,231,331,230,020,020,020,131,231,331,521,131,331,330,231,131,231,531,531,531,530,131,721,131,131,131,131,130,721,131,721,131,721,621,520,521,521,621,621,621,621,620,521,321,521,321,521,231,130.,521,430,431,331,431,331,131,231,231,131,130,020,020`,
    },
    {
        name: 'canon',
        title: '卡农',
        petName: '猫头鹰',
        pet: 'owl',
        weight: 150,
        music: `C;160;530,331,431,530,331,431,531,521,621,721,131,231,331,431,330,131,231,330,321,421,521,621,521,321,521,131,721,131,620,131,721,620,521,421,521,421,321,421,521,621,721,131,620,131,721,130,721,621,721,621,721,131,231,331,431,531,330,131,231,330,231,131,231,721,131,231,331,231,131,721,130,621,721,130,321,421,521,621,521,421,521,131,721,131,620,131,721,620,521,421,521,421,321,421,521,621,721,131,620,131,721,130,721,621,721,131,231,131,721,131,621,721,130,020,020,020`,
    },
    {
        name: 'fish',
        title: '大鱼',
        petName: '团团',
        pet: 'panda',
        weight: 100,
        music: 'G;96;611,121,121,221,221,321,321,621,520.,321,220,020,611,121,121,221,221,321,320,610,510,020,020,611,121,121,221,221,321,321,621,520.,321,220,020,221,321,610,221,321,611,511,610,020,020,611,121,220.,121,610,611,121,220.,121,320,321,521,620,621,521,321,221,120,220,320,020,611,121,220.,121,611,021,611,121,220,120,320,020,221,321,610,221,321,611,511,610,020,020,321,521,130.,721,320,321,221,120,121,221,320,321,221,120,621,131,721,621,521,221,320,020,020,321,521,130.,721,320,321,221,120,121,221,320,020,221,321,610,221,321,611,511,610', //
    },
    {
        name: 'city',
        title: '天空之城',
        petName: '大狮子',
        pet: 'lion',
        weight: 50,
        music: `D;96;621,721,130.,721,130,330,720,020,020,321,321,620.,521,620,130,520,020,020,320,420.,321,420,130,320,020,021,131,131,131,720.,4#21,4#20,720,720,020,020,621,721,130.,721,130,330,720,020,020,321,321,620.,521,620,130,520,020,020,221,321,420,131,721,721,131,130,231,231,331,131,130,020,131,721,621,621,720,5#20,620,020,020,131,231,330.,231,330,530,230,020,020,521,521,130.,721,130,330,330,020,020,020,621,721,130,720,231,231,130.,521,520,020,430,330,230,130,330,020,020,330,630,020,530,530,331,231,130,020,021,131,230,131,231,230,530,330,020,020,330,630,020,530,020,331,231,130,020,021,131,230,131,231,230,720,620,020,020`,
    },
    {
        name: 'dream',
        title: '梦幻曲',
        petName: '牛仔',
        pet: 'cow',
        weight: 30,
        music: `D;96;510,120,020,021,711,121,321,521,131,130,020,721,621,521,131,221,321,421,621,121,221,321,521,220.,021,510,120,020,021,711,121,321,521,331,330.,231,131,721,131,331,321,131,720.,6#21,620,720,521,021,510,120,020,021,711,121,321,521,6#21,6#20,020,5#21,521,421,621,221,321,420.,321,220.,611,611,021,120,420,020,021,321,421,621,121,431,430,020,331,231,131,331,621,721,130.,721,620.,321,321,021,220,120,020,021,711,121,321,521,131,130,020,721,621,521,131,221,321,421,621,121,221,321,521,220.,021,510,120,020,021,711,121,321,521,331,330.,231,131,621,521,131,221,321,421,621,221,321,421,621,611,711,120,020`,
    },
    {
        name: 'sprite',
        title: '千与千寻',
        petName: '小黄鸭',
        pet: 'duck',
        weight: 20,
        music: `F;120;121,221,321,121,520.,321,220,520,220,121,611,320.,121,710,020,710,610,710,121,221,510,120,221,321,420,421,321,221,121,220,020,121,221,321,121,520.,321,220,520,221,221,121,611,610,711,121,510,020,510,610,710,121,221,510,120,221,321,420,421,321,221,121,120,020,020,120,020,321,421,520,520,520,520,521,621,521,421,320,320,320,320,321,421,321,221,120,120,121,711,610,710,711,121,220,221,321,221,321,220,020,321,421,520,520,520,520,521,621,521,421,320,320,320,321,421,321,221,121,711,610,611,711,121,221,510,120,221,321,420,421,321,221,121,120,020,020`,
    },
    {
        name: 'fade',
        title: 'Fade',
        petName: '猴王',
        pet: 'monkey',
        weight: 10,
        music: `G;102;130,130,130,330,630,630,630,530,330,330,330,330,720,720,720,720,130,130,130,330,630,630,630,530,330,330,330,330,721,721,721,721,721,721,722.,723,722.,723,131,131,131,131,131,131,332.,333,332.,333,631,631,631,631,631,631,531,531,331,331,331,331,331,331,332.,333,332.,333,721,721,721,721,721,721,722.,723,722.,723,131,131,131,131,331,331,142.,143,732.,733,631,631,631,531,531,531,231,231,331,331,331,331,531,431,332.,233,132.,723,721,721,721,721,131,131,231,131,130,130,130,330,630,630,630,530,330,330,330,330,720,720,720,720`,
    },
    {
        name: 'sword',
        title: '仙剑问情',
        petName: '佩奇',
        pet: 'pig',
        weight: 5,
        music: `C;120;1#21,711,1#20,1#21,711,1#20,1#21,711,1#21,4#21,321,1#21,710,611,711,1#20,1#21,711,1#20,1#21,711,1#21,621,4#21,321,1#20,1#21,321,4#20,4#21,621,4#20,321,1#21,710,020,020,611,711,1#20,1#21,321,1#20,1#21,611,710,020,020,1#21,711,1#20,1#21,711,1#20,1#21,711,1#21,4#21,321,1#21,710,1#21,321,4#20.,621,4#20.,621,321,4#21,621,5#21,4#21,321,1#21,321,4#20,020,020,1#21,321,4#20,020,020,1#21,321,4#21,621,4#20,020,020,320,020,020,1#21,321,4#20,4#21,621,320.,1#21,710,020,320,710,1#20.,4#21,320,710,1#20,020,710,1#21,711,610,020,020,711,611,4#10,610,710,1#20,320,4#20,1#20.,611,710,020,1#20,320,4#20.,621,320,1#20,710,020,320,710,1#20.,4#21,320,1#20,320,020,4#20,620,720,020,4#20,020,320,020,4#20,620,1#30,720,620,320,4#20,020`,
    },
    {
        name: 'moon',
        title: '月出',
        petName: '小狗',
        pet: 'dog',
        weight: 3,
        music: `C#;100;020,321,221,320,020,321,221,320,020,321,221,320,520.,221,220,020,321,221,320,020,321,221,320,020,321,221,320,520.,511,510,610,710,121,221,320,520,220,320,021,221,321,221,320,020,021,511,610,710,121,221,320,520,510,610,021,511,611,511,610,=E,611,711,121,221,321,221,220,521,321,520,020,020,320,220,520,320,020,020,320,220,521,321,520.,321,221,121,220,321,711,710,120,020,020,610,710,121,221,320,220,121,711,120,220,320,610,020,020,020,021,611,711,121,220,320,610,220.,321,221,121,710,611,711,121,221,321,221,220,521,321,520,020,020,320,220,520,320,020,020,320,220,521,321,520.,321,221,121,220,320,710,120,020,020,610,710,121,221,320,220,121,711,120,220,320,620,020,020,020,120,220,320,520.,321,620,020,020,020,020,020`,
    },
    {
        name: 'sakura',
        title: '千本樱',
        petName: '小白兔',
        pet: 'rabbit',
        weight: 1,
        music: `C;160;521,621,222,122,222,122,521,621,222,122,222,122,521,621,222,122,222,122,421,322,422,221,121,521,621,222,122,222,122,521,621,222,122,222,122,521,621,131,431,332,432,332,232,131,621,521,621,222,122,222,122,521,621,222,122,222,122,521,621,222,122,222,122,421,322,422,221,121,221,122,222,421,222,422,621,522,622,131,622,132,431,332,432,231,131,230,221,421,521,621,222,122,222,122,521,621,222,122,222,122,521,621,222,122,222,122,421,322,422,221,121,521,621,222,122,222,122,521,621,222,122,222,122,521,621,131,431,332,432,332,232,131,621,521,621,222,122,222,122,521,621,222,122,222,122,521,621,222,122,222,122,421,322,422,221,121,522,422,622,132,232,132,622,522,221,421,521,621,221.,221.,121,220,020,221.,222,221,121,221,421,421,521,221.,222,221,121,221,121,611,121,221.,222,221,121,221,421,421,521,620,521,622,522,420,220,221.,222,221,121,221,421,421,521,221.,222,221,121,221,121,611,121,221.,222,221,121,221,421,421,521,620,521,622,522,420,220,420,320,220,120,121,122,222,611,511,610,020,611,121,220,520,320,421.,422,321,121,220,020,420,320,220,120,121,122,222,611,511,610,611,121,221,220,221,420,520,320,020,020,221,421,521.,521.,621,620.,621,131,231,521,421,620,221,421,521.,521.,621,620.,621,6#21,621,521,421,420,221,421,521.,521.,621,620.,621,131,231,521,421,620,221,421,6#20,620,520,420,521,621,321,121,220,321,521,621.,621.,721,720.,721,231,331,621,521,720,321,521,621.,621.,721,720.,721,131,721,621,521,520,321,521,621.,621.,721,720.,721,231,331,621,521,720,321,521,130,720,620,520,621,521,721,231,330,020`,
    }
];

LevelMgr._levelDataList = [{
        count: 6,   //此关底座数量
        total: 30,  //完成此关需要的底座总数量, 当前值无意义, 会根据count重新计算
        bg: 'res/ui/unpack/bg.jpg',
    },
    {
        count: 20,
        total: 50,
        bg: 'res/ui/unpack/bg0.png',
    },
    {
        count: 50,
        total: 100,
        bg: 'res/ui/unpack/bg1.png',
    },
    {
        count: 100,
        total: 200,
        bg: 'res/ui/unpack/bg2.png',
    },
    {
        count: 100,
        total: 300,
        bg: 'res/ui/unpack/bg.jpg',
    },
    {
        count: 200,
        total: 500,
        bg: 'res/ui/unpack/bg0.png',
    },
    {
        count: 200,
        total: 700,
        bg: 'res/ui/unpack/bg1.png',
    },
    {
        count: 200,
        total: 900,
        bg: 'res/ui/unpack/bg3.png',
    },
    {
        count: 200,
        total: 1100,
        bg: 'res/ui/unpack/bg.jpg',
    },
    {
        count: 200,
        total: 1300,
        bg: 'res/ui/unpack/bg0.png',
    },
    {
        count: 200,
        total: 1500,
        bg: 'res/ui/unpack/bg1.png',
    },
    {
        count: 200,
        total: 1700,
        bg: 'res/ui/unpack/bg2.png',
    },
    {
        count: 300,
        total: 2000,
        bg: 'res/ui/unpack/bg.jpg',
    },
];
let total = 0;
LevelMgr._levelDataList.forEach((obj, i) => {
    total += obj.count;
    obj.total = total;
})

// LevelMgr._petList.forEach((obj, i) => {
//     obj.pet = (i % 2 == 0) ? 'panda' : 'cat';
// })

//设置SoundMgr的音乐数据
LevelMgr._petList.forEach(obj => {
    SoundMgr.musicDataList[obj.name] = obj.music;
})

//平台模型列表
LevelMgr._platformModelList = [
    'Model1',
    'Model2',
    'Model3',
    'Model4',
    'Model5',
    'Model6',
    'Model7',
    'Model8',
    'Model9',
    'Model10',
    'Model11',
]

LevelMgr.LevelMode = {
    Level: 0,
    Battle: 1,
}

LevelMgr._levelMode = LevelMgr.LevelMode.Level;
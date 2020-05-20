import TWEEN from '../libs/tween.js';

import {
    Pool
} from '../base/Pool'
import Config from '../base/Config';
import Utils from '../base/Utils';

import DataBus from '../runtime/DataBus';
import wxDownloader from '../runtime/wx-downloader';

export default class SoundMgr {
    constructor() {
        //播放器池
        this._ctxPoolMap = new Map();
        //格式化好的乐谱对象列表
        this._musicList = {};
        //正在播放的定时器列表
        this._playingMap = {};
        //格式化好的单音列表
        this._singleToneListMap = {};
        //正在播放的音效数组列表
        this._playingEffectsMap = {};
        //下载好的音效地址
        this._mp3UrlMap = new Map();
    }

    preloadAll() {
        let arr = this.getAllFileList();
        return this.preDownloadAll(arr).then(() => {
            arr.forEach(name => {
                let file = this.getFileUrl(name);
                let pool = this.getCtxPool(file);
                let ctx = pool.get();
                ctx.pause();
                setTimeout(() => {
                    try {
                        // ctx.currentTime = 0;
                        ctx.seek(0);
                    } catch (error) {}
                }, 0);
                pool.put(ctx);
                // ctx.addEventListener('canplay', function func() {
                //     console.log(`音频${name}可以播放了`);
                //     ctx.removeEventListener('canplay', func);
                // })
                // ctx.addEventListener('error', function func() {
                //     console.log(`音频${name}出错了`);
                //     ctx.removeEventListener('error', func);
                // })
                ctx.onCanplay(function func() {
                    console.log(`音频${name}可以播放了`);
                    ctx.offCanplay(func);
                })
                ctx.onError(function func(err) {
                    console.log(`音频${name}出错了`, err);
                    ctx.offError(func);
                })
            });
        })
    }

    preDownloadAll(arr) {
        let downloadFunc = arr => {
            return arr.map(name => {
                let url = this.getUrl(name);
                return wxDownloader.preloadFile(url).then(url => {
                    console.log(`下载音效${name}成功: ${url}`)
                    this._mp3UrlMap.set(name, url);
                }).catch(() => {
                    console.log(`下载音效${name}失败`)
                })
            })
        }

        let next = (arr, i) => {
            if(i < arr.length) {
                return Promise.all(downloadFunc(arr[i])).then(() => {
                    return next(arr, i + 1);
                })
            } else {
                console.log('预下载音效结束');
                return Promise.resolve();
            }
        }

        let arrMap = Utils.groupFor(arr, 5);
        return next(arrMap, 0);
    }

    getAllFileList() {
        if(!this._allFileList) {
            let arr = [
                'click.mp3',
                'grow.mp3',
                'popout.mp3',
                'score0.mp3',
                'score1.mp3',
                'score2.mp3',
                'score3.mp3',
            ];
            for(let i in SoundMgr.toneFileList) {
                arr.push(SoundMgr.toneFileList[i]);
            }
            this._allFileList = arr;
        }
        return this._allFileList;
    }

    getFileUrl(name) {
        // return 'res/audio/' + name;
        if(this._mp3UrlMap.has(name)) {
            return this._mp3UrlMap.get(name);
        }
        return 'https://imgcache.xiaoyouxiqun.com/game_general/bridge01/' + Config.modelVersion + '/audio/' + name.replace('#', '%23');
    }

    getUrl(name) {
        return 'audio/' + name.replace('#', '%23');
    }

    playEffect(name) {
        if(!DataBus.soundEnabled) {
            return;
        }

        let file = this.getFileUrl(name);
        let pool = this.getCtxPool(file);
        let ctx = pool.get();
        ctx.play();
        let onEnded = () => {
            ctx.offEnded(onEnded);
            // ctx.removeEventListener('ended', onEnded);
            pool.put(ctx);
        }
        ctx.onEnded(onEnded);
        // ctx.addEventListener('ended', onEnded);
        this._playingEffectsMap[name] || (this._playingEffectsMap[name] = []);
        this._playingEffectsMap[name].push({
            ctx: ctx,
            func: onEnded,
        });
        return ctx;
    }

    stopEffect(name) {
        if(Array.isArray(this._playingEffectsMap[name])) {
            let file = this.getFileUrl(name);
            let pool = this.getCtxPool(file);
            this._playingEffectsMap[name].forEach(o => {
                let ctx = o.ctx;
                let onEnded = o.func;
                ctx.offEnded(onEnded);
                // ctx.removeEventListener('ended', onEnded);
                // ctx.pause();
                // setTimeout(() => {
                //     try {
                //         ctx.currentTime = 0;
                //     } catch (error) {}
                // }, 0);
                ctx.stop();
                pool.put(ctx);
            });
            this._playingEffectsMap[name].length = 0;
        }
    }

    //播放一个音
    playTone(name) {
        if(!DataBus.soundEnabled) {
            return;
        }

        if (name[0] == '0') {
            return;
        }
        let src = this.getFileUrl(SoundMgr.toneFileList[name]);
        // console.log(src);
        if (src) {
            let pool = this.getCtxPool(src);
            let ctx = pool.get();
            ctx.play();
            let onEnded = () => {
                ctx.offEnded(onEnded);
                // ctx.removeEventListener('ended', onEnded);
                pool.put(ctx);
            }
            ctx.onEnded(onEnded);
            // ctx.addEventListener('ended', onEnded);
            // console.log(`播放音【${name}】:`, src);
        } else {
            console.log(`音【${name}】不存在!`);
        }
    }

    //播放乐谱上的一个音
    playMusicTone(name, index) {
        if(!DataBus.soundEnabled) {
            return;
        }

        let tone = this._getMusicTone(name, index);
        tone && this.playTone(tone);
    }

    //获取乐谱有效音长度
    getMusicTonesLength(name) {
        let toneList = this._getMusicToneList(name);
        return Array.isArray(toneList) ? toneList.length : 0;
    }

    //播放随机乐谱
    playRandom() {
        if(!DataBus.soundEnabled) {
            return;
        }

        let names = Object.keys(SoundMgr.musicDataList);
        let rnd = Math.floor(Math.random() * 10000 % names.length);
        this.playMusic(names[rnd]);
    }

    //播放乐谱
    playMusic(name) {
        if(!DataBus.soundEnabled) {
            return;
        }
        
        let obj = this._getMusicObj(name);
        if (obj) {
            this._playingMap[name] = this._playMusicObj(obj);
        }
    }

    stopMusic(name) {
        Array.isArray(this._playingMap[name]) && this._playingMap[name].forEach(timer => {
            clearTimeout(timer);
            // TWEEN.remove(timer);
        });
        delete this._playingMap[name];
    }

    stopAllMusic() {
        let arr = Object.keys(this._playingMap);
        arr.forEach(name => {
            this.stopMusic(name);
        })
    }

    //获取乐谱中的单个音
    _getMusicTone(name, index) {
        if(index < 0) {
            return;
        }
        let toneList = this._getMusicToneList(name);
        if(toneList && index < toneList.length) {
            return toneList[index];
        }
        return null;
    }

    _getMusicToneList(name) {
        let toneList = this._singleToneListMap[name];
        if(!toneList) {
            let obj = this._getMusicObj(name);
            if(obj) {
                toneList = this._convertMusicObjToSingleToneList(obj);
                this._singleToneListMap[name] = toneList;
            }
        }
        return toneList;
    }

    //格式化乐谱对象为单音列表 (不包含时长/停顿等信息)
    _convertMusicObjToSingleToneList(obj) {
        let ret = [];
        let base = obj.base;

        obj.content.map(note => {
            if (note.modulation) {
                base = note.modulation;
            } else {
                let toneName = SoundMgr.getToneName(note.pitch, note.scale, base);
                (toneName[0] != '0') && ret.push(toneName);
            }
        });
        return ret;
    }

    //获取乐谱对象
    _getMusicObj(name) {
        let obj = this._musicList[name];
        if (!obj) {
            let str = SoundMgr.musicDataList[name];
            if (str) {
                obj = this._parseMusic(str);
                this._musicList[name] = obj;
            }
        }
        return obj;
    }

    //播放乐谱对象
    _playMusicObj(obj) {
        let interval = 60 * 1000 / obj.tempo; //每拍时间
        let time = 0;
        let base = obj.base;

        //用于链式延时
        // let lastTimer = null;

        return obj.content.map(note => {
            if (note.modulation) {
                base = note.modulation;
                return -1;
            }
            let toneName = SoundMgr.getToneName(note.pitch, note.scale, base);
            let duration = interval * 4 / Math.pow(2, 2 + (parseInt(note.meter[0]) || 0));
            if (note.meter[1] == '.') {
                duration *= 1.5;
            }

            //链式延时
            // let timer = this._playToneDelay(toneName, duration);
            // if(lastTimer) {
            //     lastTimer.chain(timer);
            // } else {
            //     timer.start();
            // }
            // lastTimer = timer;
            
            // 平行延时
            let timer = this._playToneDelay(toneName, time);
            time += duration;

            return timer;
        })
    }

    _playToneDelay(name, delay) {
        //缓动动画链式延时
        // return new TWEEN.Tween({}).to({}, delay / 1000).onStart(() => {
        //     this.playTone(name);
        // });
        
        //缓动动画延时
        // return new TWEEN.Tween({}).to({}, delay / 1000).onComplete(() => {
        //     this.playTone(name);
        // }).start();

        //定时器延时
        return setTimeout(() => {
            this.playTone(name);
        }, delay);
    }

    //格式化乐谱字符串
    _parseMusic(str) {
        let obj = {};
        let arr = str.split(';');
        obj.base = arr[0].trim() || 'C'; //基调
        obj.tempo = parseInt(arr[1].trim()) || 100; //速度
        obj.content = this._parseMusicContent(arr[2].trim()); //乐谱
        return obj;
    }
    _parseMusicContent(content) {
        let ret = [];
        let arr = content.split(',');
        arr.forEach(note => {
            note && ret.push(this._parseMusicNote(note.trim()));
        });
        return ret;
    }
    _parseMusicNote(note) {
        if (note[0] == '=') {
            return {
                modulation: note.substring(1)
            };
        }
        let ret = {};
        let index = 0;
        ret.pitch = note[index++]; //音高
        (note[index] == '#') && (ret.pitch += note[index++]); //升调
        ret.scale = note[index++] || 0; //八度
        ret.meter = note[index++] || 0; //节拍
        note[index] && (ret.meter += note[index]); //符号.延音
        return ret;
    }


    
    //获取音阶名的方法
    static getToneName(value, scale, base = 'C') {
        if (value[0] == '0') {
            return '0';
        }
        let baseIndex = SoundMgr.toneNameList.indexOf(base);
        let v0 = value[0] - 1,
            v1 = value[1];
        let vIndex = SoundMgr.toneIndexes[v0];
        let plus = v1 == '#' ? 1 : 0;
        let index = (baseIndex + vIndex + plus);
        let len = SoundMgr.toneNameList.length;
        if (index >= len) {
            scale = parseInt(scale) + 1;
            index = index % len;
        }
        return SoundMgr.toneNameList[index] + scale;
    }

    getCtxPool(src) {
        let pool = this._ctxPoolMap.get(src);
        if (!pool) {
            pool = new Pool();
            pool.createFunc = () => {
                let ctx = wx.createInnerAudioContext();
                // let ctx = document.createElement('audio');
                ctx.autoplay = false;
                ctx.loop = false;
                ctx.obeyMuteSwitch = true;
                ctx.volume = 1;
                ctx.src = src;
                return ctx;
            }
            this._ctxPoolMap.set(src, pool);
        }
        return pool;
    }
}


//音阶文件列表
SoundMgr.toneFileList = {
    'C2': '00-C6.mp3',
    'C#2': '01-C#6.mp3',
    'D2': '02-D6.mp3',
    'D#2': '03-D#6.mp3',
    'E2': '04-E6.mp3',
    'F2': '05-F6.mp3',
    'F#2': '06-F#6.mp3',
    'G2': '07-G6.mp3',
    'G#2': '08-G#6.mp3',
    'A2': '09-A6.mp3',
    'A#2': '10-A#6.mp3',
    'C1': '100-C5.mp3',
    'C#1': '101-C#5.mp3',
    'D1': '102-D5.mp3',
    'D#1': '103-D#5.mp3',
    'E1': '104-E5.mp3',
    'F1': '105-F5.mp3',
    'F#1': '106-F#5.mp3',
    'G1': '107-G5.mp3',
    'G#1': '108-G#5.mp3',
    'A1': '109-A5.mp3',
    'B2': '11-B6.mp3',
    'A#1': '110-A#5.mp3',
    'B1': '111-B5.mp3',
    'C3': '12-C7.mp3',
    'C#3': '13-C#7.mp3',
    'D3': '14-D7.mp3',
    'D#3': '15-D#7.mp3',
    'E3': '16-E7.mp3',
    'F3': '17-F7.mp3',
    'F#3': '18-F#7.mp3',
    'G3': '19-G7.mp3',
    'G#3': '20-G#7.mp3',
    'A3': '21-A7.mp3',
    'A#3': '22-A#7.mp3',
    'B3': '23-B7.mp3',
    'C4': '24-C8.mp3',
    'C#4': '25-C#8.mp3',
    'D4': '26-D8.mp3',
    'D#4': '27-D#8.mp3',
    'E4': '28-E8.mp3',
    'F4': '29-F8.mp3',
    'F#4': '30-F#8.mp3',
    'G4': '31-G8.mp3',
    'G#4': '32-G#8.mp3',
    'A4': '33-A8.mp3',
    'A#4': '34-A#8.mp3',
    'B4': '35-B8.mp3',
    'C5': '36-C9.mp3',
}

//半音阶名称列表
SoundMgr.toneNameList = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
]
//7音阶在半音阶列表中的索引
SoundMgr.toneIndexes = [
    0, 2, 4, 5, 7, 9, 11
]



//曲谱数据列表
SoundMgr.musicDataList = {
    // 'city_in_sky': 'C;120;621,721,130.,721,130,330,720,020,020,320,620.,521,620,130,520,020,020,421,321,420.,321,420,130,320,021,131,131,131,720.,421,420,720,720,020,020,621,721,130.,721,130,330,720,020,020,321,321,620.,521,620,130,520,020,020,320,420,131,721,130,230,331,131,020,020,131,721,620,720,520,620,020,020,131,231,330.,231,330,530,230,020,020,521,521,132.721,130,330,330',//
    // '三寸天堂': 'D;70;321,521,620.,621,521,221,121,221,321,521,221,321,120,321,521,620.,621,521,221,121,220,320,020,021,321,521,',//
    // 'that_girl': 'C#;89;611,711,120.,612,122,711,611,511,612,312,010,010,011.,612,611,711,120,011,121,711,611,511,612,612,010,010,010,',//
}

SoundMgr.instance = new SoundMgr();
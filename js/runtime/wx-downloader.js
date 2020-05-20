import Path from '../libs/path'
import promisify from '../libs/Promisify'

import DataBus from '../runtime/DataBus'
import Config from '../base/Config';

var ID = 'WXDownloader';

// var non_text_format = [
//     'js','png','jpg','bmp','jpeg','gif','ico','tiff','webp','image','mp3','ogg','wav','m4a','font','eot','ttf','woff','svg','ttc'
// ];

const REGEX = /^\w+:\/\/.*/;

const LOADING = 0;
const COMPLETE = 1;

// has sub domain
var isSubdomain = wx.getGroupCloudStorage && wx.getFriendCloudStorage;

var fs = isSubdomain ? {} : wx.getFileSystemManager();

class WXDownloader {
    constructor() {
        this.id = ID;
        this.REMOTE_SERVER_ROOT = Config.modelRemoteUrl;
        this.LOCAL_TEMP_ROOT = 'download';
        this.FILE_VERSION = Config.modelVersion;
    }
}
WXDownloader.ID = ID;
window.WXDownloader = WXDownloader;

WXDownloader.prototype.handle = function (item, callback) {

    item.state = LOADING;
 
    var filePath = getPackagePath(item.url);
    // Read from package
    fs.access({
        path: filePath,
        success: function () {
            item.url = filePath;
            readText(item, callback);
        },
        fail: function (res) {
            readFromLocal(item, callback);
        }
    });
};

WXDownloader.prototype.preloadFile = function(url) {
    console.log('wxDownloader.preloadFile: ', url);
    let filePath = getPackagePath(url);
    return promisify(fs.access, {
        path: filePath,
    }).then(() => {
        return Promise.resolve(filePath);
    }).catch((res) => {
        let localPath = getLocalPath(url);
        return promisify(fs.access, {
            path: localPath,
        }).then(() => {
            return Promise.resolve(localPath);
        }).catch((res) => {
            let relatUrl = url;
            let remoteUrl = '';
            
            // filter protocol url (E.g: https:// or http:// or ftp://)
            if (REGEX.test(relatUrl)) {
                remoteUrl = relatUrl;
            } else if(wxDownloader.REMOTE_SERVER_ROOT) {
                remoteUrl = getRemotePath(relatUrl);
            } else {
                return Promise.reject();
            }
    
            return promisify(wx.downloadFile, {
                url: remoteUrl,
            }).then(res => {
                if (res.tempFilePath) {
                    let localPath = getLocalPath(relatUrl);
                    return new Promise((resolve, reject) => {
                        ensureDirFor(localPath, success => {
                            success ? resolve() : reject();
                        });
                    }).then(() => {
                        // Save to local path
                        return promisify(wx.saveFile, {
                            tempFilePath: res.tempFilePath,
                            filePath: localPath,
                        }).then(res => {
                            console.log('保存文件' + localPath + '成功: ', res);
                            recordDownload(relatUrl, localPath);
                            return Promise.resolve(localPath);
                        }).catch(res => {
                            // Failed to save file, then just use remote url
                            console.log('保存文件' + localPath + '失败: ', res);
                            return Promise.resolve(remoteUrl);
                        })
                    }).catch(() => {
                        return Promise.resolve(remoteUrl);
                    })
                }
                else {
                    // 没有临时文件
                    console.log(`下载${remoteUrl}失败: `, res);
                    return Promise.reject();
                }
            }).catch(res => {
                //下载失败
                console.log(`下载${remoteUrl}失败: `, res);
                return Promise.reject();
            });
        });
    });
};


WXDownloader.prototype.cleanAllAssets = function (callback) {
    // let path = getLocalPath();
    // fs.rmdir({
    //     dirPath: path,
    //     recursive: true,
    //     success: function () {
    //         console.log('Removed local path ' + path + ' successfully!');
    //     },
    //     fail: function (res) {
    //         console.warn('Failed to remove path(' + path + '): ' + (res ? res.errMsg : 'unknown error'));
    //     }
    // });

    // return rm(getLocalPath()).then(() => {
    //     DataBus.modelDownloadVersion = this.FILE_VERSION;
    //     DataBus.saveAllData();
    //     callback && callback();
    // });

    let arr = [];
    for(let name in DataBus.downloadFileMap) {
        let localPath = DataBus.downloadFileMap[name];
        arr.push(promisify(fs.unlink, {
            filePath: localPath,
        }));
    }
    return Promise.all(arr).then(() => {
        DataBus.downloadFileMap = {};
        DataBus.modelDownloadVersion = this.FILE_VERSION;
        DataBus.saveAllData();
        callback && callback();
    });




    // fs.getSavedFileList({
    //     success: function (res) {
    //         console.log('getSavedFileList: ', res);
    //         var list = res.fileList;
    //         if (list) {
    //             for (var i = 0; i < list.length; i++) {
    //                 var path = list[i].filePath;
    //                 fs.unlink({
    //                     filePath: list[i].filePath,
    //                     success: function () {
    //                         console.log('Removed local file ' + path + ' successfully!');
    //                     },
    //                     fail: function (res) {
    //                         console.warn('Failed to remove file(' + path + '): ' + res ? res.errMsg : 'unknown error');
    //                     }
    //                 });
    //             }
    //         }
    //     },
    //     fail: function (res) {
    //         console.warn('Failed to list all saved files: ' + res ? res.errMsg : 'unknown error');
    //     }
    // });
};

var wxDownloader = window.wxDownloader = new WXDownloader();
export default wxDownloader;

function getPackagePath (relatUrl) {
    return /^res\//.test(relatUrl) ? relatUrl : ('res/' + relatUrl);
};

function getLocalPath (relatUrl) {
    return wx.env.USER_DATA_PATH + '/' + wxDownloader.LOCAL_TEMP_ROOT + (relatUrl ? ('/' + relatUrl) : '');
};

function getRemotePath (relatUrl) {
    return wxDownloader.REMOTE_SERVER_ROOT + '/' + wxDownloader.FILE_VERSION + '/' + relatUrl;
}

function readText (item, callback) {
    var url = item.url;
    fs.readFile({
        filePath: url,
        encoding: 'utf8',
        success: function (res) {
            item.state = COMPLETE;
            callback(null, res.data);
        },
        fail: function (res) {
            console.warn('Read file failed: ' + url);
            fs.unlink({
                filePath: url,
                success: function () {
                    console.log('Read file failed, removed local file ' + url + ' successfully!');
                }
            });
            callback({
                status: 0,
                errorMessage: res && res.errMsg ? res.errMsg : "Read text file failed: " + url
            });
        }
    });
}

function readFromLocal (item, callback) {
    console.log('wxDownloader: 尝试从本地加载: ', item.url);
    var localPath = getLocalPath(item.url);
    // Read from local file cache
    fs.access({
        path: localPath,
        success: function () {
            item.url = localPath;
            readText(item, callback);
        },
        fail: function (res) {
            // No remote server indicated, then continue to downloader
            if (!wxDownloader.REMOTE_SERVER_ROOT) {
                callback(null, null);
                return;
            }

            // downloadRemoteFile(item, callback);
            downloadRemoteTextFile(item, callback);
        }
    });
}

function ensureDirFor (path, callback) {
    // console.log('mkdir:' + path);
    var ensureDir = Path.dirname(path);
    if (ensureDir === "wxfile:/" || ensureDir === "http:/") {
        callback(true);
        return;
    }
    fs.access({
        path: ensureDir,
        success: function (res) {
            console.log('ensureDirFor success: ', res);
            callback && callback(true);
        },
        fail: function (res) {
            console.log('ensureDirFor fail: ', res);
            ensureDirFor(ensureDir, function (success) {
                fs.mkdir({
                    dirPath: ensureDir,
                    success: function (res) {
                        console.log('mkdir ' + ensureDir + ' success: ', res);
                        callback && callback(true);
                    },
                    fail: function (res) {
                        console.log('mkdir ' + ensureDir + ' fail: ', res);
                        callback && callback(false);
                    },
                });
            });
        },
    });
}

function recordDownload(name, localPath) {
    DataBus.downloadFileMap[name] = localPath;
    DataBus.setVarDirty('downloadFileMap')
    // DataBus.saveAllData();
}

function downloadRemoteFile (item, callback) {
    console.log('wxDownloader: 尝试从网络下载: ', item.url);
    
    // Download from remote server
    var relatUrl = item.url;

    // filter protocol url (E.g: https:// or http:// or ftp://)
    if (REGEX.test(relatUrl)) {
        callback(null, null);
        return
    }

    var remoteUrl = getRemotePath(relatUrl);
    item.url = remoteUrl;
    wx.downloadFile({
        url: remoteUrl,
        success: function (res) {
            if (res.statusCode === 404) {
                console.warn("Download file failed: " + remoteUrl);
                callback({
                    status: 0,
                    errorMessage: res && res.errMsg ? res.errMsg : "Download file failed: " + remoteUrl
                });
            }
            else if (res.tempFilePath) {
                // http reading is not cached
                var localPath = getLocalPath(relatUrl);
                // check and mkdir remote folder has exists
                ensureDirFor(localPath, function () {
                    // Save to local path
                    wx.saveFile({
                        tempFilePath: res.tempFilePath,
                        filePath: localPath,
                        success: function (res) {
                            console.log('保存文件' + localPath + '成功: ', res);
                            recordDownload(relatUrl, localPath);
                            item.url = res.savedFilePath;
                            readText(item, callback);
                        },
                        fail: function (res) {
                            // Failed to save file, then just use remote url
                            console.log('保存文件' + localPath + '失败: ', res);
                            callback(null, null);
                        }
                    });
                });
            }
            else {
                // 没有临时文件
                callback(null, null);
            }
        },
        fail: function (res) {
            // Continue to try download with downloader, most probably will also fail
            callback(null, null);
        }
    })
}

function downloadRemoteTextFile (item, callback) {
    console.log('wxDownloader: 尝试从网络下载: ', item.url);
    // Download from remote server
    var relatUrl = item.url;
    var remoteUrl = getRemotePath(relatUrl);
    item.url = remoteUrl;
    wx.request({
        url: remoteUrl,
        responseType: 'arraybuffer',
        success: function(res) {
            if (res.data) {
                if (res.statusCode === 200 || res.statusCode === 0) {
                    var data = res.data;
                    item.state = COMPLETE;
                    if (data) {
                        if (typeof data !== 'string' && !(data instanceof ArrayBuffer)) {
                            // Should we check if item.type is json ? If not, loader behavior could be different
                            item.state = COMPLETE;
                            callback(null, data);
                            data = JSON.stringify(data);
                        }
                        else {
                            callback(null, data);
                        }
                    }

                    // Save to local path
                    var localPath = getLocalPath(relatUrl);
                    // Should recursively mkdir first
                    ensureDirFor(localPath, function () {
                        fs.writeFile({
                            filePath: localPath,
                            data: data,
                            encoding: 'utf8',
                            success: function (res) {
                                console.log('写文件' + localPath + '成功! ', res);
                                recordDownload(relatUrl, localPath);
                            },
                            fail: function (res) {
                                // undone implementation
                                console.log('写文件' + localPath + '失败! ', res);
                            }
                        });
                    });
                } else {
                    console.warn("Download text file failed: " + remoteUrl);
                    callback({
                        status:0, 
                        errorMessage: res && res.errMsg ? res.errMsg : "Download text file failed: " + remoteUrl
                    });
                }
            }
        },
        fail: function (res) {
            // Continue to try download with downloader, most probably will also fail
            callback(null, null);
        }
    });
}

function rm(path) {
    return promisify(fs.stat, {
        path: path,
    }).then(res => {
        if(res.stats.isDirectory()) {
            return promisify(fs.readdir, {
                dirPath: path,
            }).then(files => {
                return Promise.all(files.map(f => {
                    return rm(path + '/' + f);
                })).then(() => {
                    return promisify(fs.rmdir, {
                        dirPath: path,
                    });
                });
            })
        } else {
            return promisify(fs.unlink, {
                filePath: path,
            });
        }
    })
}

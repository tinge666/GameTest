import Config from '../base/Config'

export default class FeedbackBtn{
    static tryToShow(){
        if(!FeedbackBtn.btn){
            FeedbackBtn._createBtn();
        }

        if(FeedbackBtn.btn){
            if(FeedbackBtn.mask > 0){
                FeedbackBtn.btn.hide();
            }else if(FeedbackBtn.depend > 0){
                FeedbackBtn.btn.show();
            }else{
                FeedbackBtn.btn.hide();
            }
        }
    }

    /**
     * 增减依靠, 当依靠大于0时, 才有机会显示
     * @param {*} inc 
     */
    static changeDepend(inc) {
        FeedbackBtn.depend += inc;
        FeedbackBtn.tryToShow();
    }

    /**
     * 增减屏蔽, 当屏蔽大于0时, 不显示
     * @param {*} inc 
     */
    static changeMask(inc) {
        FeedbackBtn.mask += inc;
        FeedbackBtn.tryToShow();        
    }

    static _createBtn() {
        if(window.wx && typeof wx.createFeedbackButton == 'function'){
            FeedbackBtn.btn = wx.createFeedbackButton({
                type: 'text',
                text: '投诉反馈',
                style: {
                    left: 8,
                    top: Math.floor(8 + (Config.isIPhoneX ? 40 : 0) / Config.vHeight * Config.sys.screenHeight),
                    width: 86,
                    height: 32,
                    lineHeight: 32,
                    backgroundColor: '#00000080',
                    color: '#ffffff',
                    textAlign: 'center',
                    fontSize: 14,
                    borderRadius: 16
                }
            })
        }
    }
}

FeedbackBtn.btn = null;
FeedbackBtn.depend = 0;
FeedbackBtn.mask = 0;
const fullTagReg = /^\[([a-zA-Z0-9]*)(=?)(.*?)\](.*?)\[(\/([a-zA-Z0-9]*))\]/
const sectTagReg = /^\[([a-zA-Z0-9]*)(=?)(.*?)\](.*?)(?=\[)/
const textReg = /(.*?)(?=\[)/

/**
 * 将UBB字符串转为对象数组, 如'[color=#ffff00]test1[/color]test2', 将被转换为[{k:'color',v:'#ffff00',s:'test1'}, {s:'test2'}];
 * 对不规范的格式(如标签内含空格, 或标签不成套), 不保证支持, 如'[c= 1]test[ /c]'
 * 不支持标签嵌套, 如'[b][s]test[/s][/b]'
 */
export default class Ubb {
    static parse(str) {
        let arr = [];
        let temp = str.trim();
        if (!temp[0]) {
            return arr;
        } else if (temp[0] == '[') {
            let r = fullTagReg.exec(temp);
            if (!r) {
                r = sectTagReg.exec(temp);
            }
            if (r) {
                arr.push({
                    k: r[1].trim().toLowerCase(),
                    v: r[3].trim(),
                    s: r[4],
                })
                temp = temp.replace(r[0], '');
            } else {
                arr.push({
                    s: temp,
                })
                temp = '';
            }
        } else {
            let r = textReg.exec(temp);
            if (r) {
                arr.push({
                    s: r[1],
                })
                temp = temp.replace(r[0], '');
            } else {
                arr.push({
                    s: temp,
                })
                temp = '';
            }
        }
        return [...arr, ...this.parse(temp)];
    }
}
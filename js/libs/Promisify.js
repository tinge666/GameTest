
export default function promisify(method, object = {}) {
    return new Promise((resolve, reject) => {
        object.success = res => resolve(res);
        object.fail = res => reject(res);
        method(object);
    });
}
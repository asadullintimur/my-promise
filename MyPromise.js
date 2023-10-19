export default class MyPromise {
    callbacks = [];

    constructor(func) {
        func(this._getResolveWithContext(), this._getRejectWithContext())
    }

    then(callback) {
        this.callbacks.push({type: 'then', callback});
    }

    catch(callback) {
        this.callbacks.push({type: 'catch', callback});
    }

    finally(callback) {
        this.callbacks.push({type: 'finally', callback});
    }

    _getResolveWithContext() {
        return this._resolve.bind(this);
    }

    _getRejectWithContext() {
        return this._reject.bind(this);
    }

    _getCallbacksByType(type) {
        return this.callbacks.filter(callback => callback.type === type || callback.type === 'finally')
    }
    _executeCallbacks(callbacks, arg) {
        callbacks.forEach(({type: callbackType, callback}) => {
            if (callbackType === 'finally') {
                callback();

                return;
            }

            callback(arg)
        })
    }

    _resolve(arg) {
        const callbacks = this._getCallbacksByType('then');

        this._executeCallbacks(callbacks, arg)
    }
    _reject(arg) {
        const callbacks = this._getCallbacksByType('catch');

        this._executeCallbacks(callbacks, arg)
    }
}
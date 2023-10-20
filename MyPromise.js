export default class MyPromise {
    state = null;
    result = null;

    callbacks = [];
    callbacksPromise = new Map();

    constructor(func) {
        if (func) func(this._getResolveWithContext(), this._getRejectWithContext())
    }

    _addCallbackPromise(callback) {
        const callbackPromise = new MyPromise();
        this.callbacksPromise.set(callback, callbackPromise)

        return callbackPromise;
    }

    then(callback) {
        this.callbacks.push({type: 'then', callback});

        return this._addCallbackPromise(callback);
    }

    catch(callback) {
        this.callbacks.push({type: 'catch', callback});

        return this._addCallbackPromise(callback);
    }

    finally(callback) {
        this.callbacks.push({type: 'finally', callback});

        return this._addCallbackPromise(callback);
    }

    _getResolveWithContext() {
        return this._resolve.bind(this);
    }

    _getRejectWithContext() {
        return this._reject.bind(this);
    }

    _getCallbacksByState() {
        const state = this.state;

        if (!state) return;

        const type = state === 'resolved' ? 'then' : 'catch'

        return this.callbacks.filter(callback => callback.type === type || callback.type === 'finally')
    }

    _executeCallbacks() {
        const callbacks = this._getCallbacksByState();

        callbacks.forEach(({type: callbackType, callback}) => {
            if (callbackType === 'finally') {
                this._executeFinallyCallback(callback)

                return;
            }

            this._executeThenCatchCallback(callback);
        })
    }

    _passCurrentPromiseForward(callbackPromise) {
        if (this.state === 'resolved') {
            callbackPromise._resolve(this.result);

            return;
        }

        callbackPromise._reject(this.result);
    }

    _executeFinallyCallback(callback) {
        const result = callback(),
            callbackPromise = this.callbacksPromise.get(callback);

        if (result instanceof MyPromise) {
            result.then(() => callbackPromise._resolve(this.result));
            result.catch(result => callbackPromise._reject(result));

            return;
        }

        this._passCurrentPromiseForward(callbackPromise);
    }

    _executeThenCatchCallback(callback) {
        const result = callback(this.result),
            callbackPromise = this.callbacksPromise.get(callback);

        if (result instanceof MyPromise) {
            result.then(result => callbackPromise._resolve(result));
            result.catch(result => callbackPromise._reject(result));

            return;
        }

        callbackPromise._resolve(result);
    }

    _resolve(result) {
        this.state = 'resolved';
        this.result = result;

        this._executeCallbacks()
    }

    _reject(result) {
        this.state = 'rejected';
        this.result = result;

        this._executeCallbacks()
    }
}
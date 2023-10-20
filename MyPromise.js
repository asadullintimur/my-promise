export default class MyPromise {
    state = null;
    result = null;

    callbacks = [];
    callbacksPromise = new Map();

    constructor(func) {
        this._callMyPromiseFunc(func);
    }

    _callMyPromiseFunc(func) {
        try {
            if (func) func(this._getResolveWithContext(), this._getRejectWithContext())
        } catch (error) {
            setTimeout(() => {
                this._reject(error)
            })
        }
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

    _getOppositeCallbacks() {
        const state = this.state;

        if (!state) return;

        const oppositeType = state === 'resolved' ? 'catch' : 'then'

        return this.callbacks.filter(callback => callback.type === oppositeType)
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
        const callbackPromise = this.callbacksPromise.get(callback);
        try {
            const result = callback();

            if (result instanceof MyPromise) {
                result.then(() => callbackPromise._resolve(this.result));
                result.catch(result => callbackPromise._reject(result));

                return;
            }

            this._passCurrentPromiseForward(callbackPromise);
        } catch (error) {
            this._handleExecuteCallbackError(callbackPromise, error)
        }
    }

    _executeThenCatchCallback(callback) {
        const callbackPromise = this.callbacksPromise.get(callback);

        try {
            const result = callback(this.result);

            if (result instanceof MyPromise) {
                result.then(result => callbackPromise._resolve(result));
                result.catch(result => callbackPromise._reject(result));

                return;
            }

            callbackPromise._resolve(result);
        } catch (error) {
            this._handleExecuteCallbackError(callbackPromise, error)
        }
    }

    _handleExecuteCallbackError(callbackPromise, error) {
        setTimeout(() => {
            callbackPromise._reject(error);
        }, 0)
    }

    _executeOppositeHandlers() {
        const oppositeCallbacks = this._getOppositeCallbacks();

        oppositeCallbacks.forEach(({callback: oppositeCallback}) => {
            const callbackPromise = this.callbacksPromise.get(oppositeCallback);

            this._passCurrentPromiseForward(callbackPromise);
        })
    }

    _resolve(result) {
        this.state = 'resolved';
        this.result = result;

        this._executeCallbacks()
        this._executeOppositeHandlers()
    }

    _reject(result) {
        this.state = 'rejected';
        this.result = result;

        this._executeCallbacks()
        this._executeOppositeHandlers()
    }
}
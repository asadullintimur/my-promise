type ResolveSignature = (result?: any) => void;
type RejectSignature = ResolveSignature;

type MyPromiseFunction = (resolve?: ResolveSignature, reject?: RejectSignature) => any;

type Callback = (result?: any) => any;
type CallbackType = "then" | "catch" | "finally";

interface CallbackItem {
    type: CallbackType,
    callback: Callback
}

export default class MyPromise {
    protected state: "resolved" | "rejected" | null = null;
    protected result: any = null;

    protected callbackItems: Array<CallbackItem> = [];
    protected callbackItemsPromise: Map<CallbackItem, MyPromise> = new Map();

    constructor(func?: MyPromiseFunction) {
        if (func) this.callMyPromiseFunc(func);
    }

    protected callMyPromiseFunc(func: MyPromiseFunction) {
        try {
            func(this.getResolveWithContext(), this.getRejectWithContext());
        } catch (error) {
            setTimeout(() => {
                this.reject(error);
            });
        }
    }

    protected addPromiseToCallbackItem(callbackItem: CallbackItem) {
        const callbackItemPromise = new MyPromise();
        this.callbackItemsPromise.set(callbackItem, callbackItemPromise);

        return callbackItemPromise;
    }

    protected addCallbackItem(callback: Callback, type: CallbackType) {
        const callbackItem: CallbackItem = {
            type,
            callback
        };

        this.callbackItems.push(callbackItem);

        return this.addPromiseToCallbackItem(callbackItem);
    }

    then(callback: Callback) {
        return this.addCallbackItem(callback, "then");
    }

    catch(callback: Callback) {
        return this.addCallbackItem(callback, "catch");
    }

    finally(callback: Callback) {
        return this.addCallbackItem(callback, "finally");
    }

    protected getResolveWithContext() {
        return this.resolve.bind(this);
    }

    protected getRejectWithContext() {
        return this.reject.bind(this);
    }


    protected getCallbackItemsByState() {
        const {state} = this;

        if (!state) return;

        const type = state === "resolved" ? "then" : "catch";

        return this.callbackItems.filter(({type: callbackType}) => callbackType === type || callbackType === "finally");
    }

    protected getCallbackItemsByOppositeState() {
        const {state} = this;

        if (!state) return;

        const type = state === "resolved" ? "catch" : "then";

        return this.callbackItems.filter(({type: callbackType}) => callbackType === type);
    }

    protected executeCallbacks() {
        const callbackItems = this.getCallbackItemsByState();

        callbackItems.forEach(callbackItem => {
            if (callbackItem.type === "finally") {
                this.executeFinallyCallback(callbackItem);

                return;
            }

            this.executeThenCatchCallback(callbackItem);
        });
    }

    protected checkCallbackItemsIsEmpty(myPromise: MyPromise) {
        return !myPromise.callbackItems.length;
    }

    protected passCurrentMyPromiseForward(callbackItemPromise: MyPromise) {
        if (this.state === "resolved") {
            callbackItemPromise.resolve(this.result);

            return;
        }

        if (this.checkCallbackItemsIsEmpty(callbackItemPromise)) throw this.result;

        callbackItemPromise.reject(this.result);
    }

    protected executeFinallyCallback(callbackItem: CallbackItem) {
        const callbackItemPromise = this.callbackItemsPromise.get(callbackItem);

        try {
            const result = callbackItem.callback();

            if (result instanceof MyPromise) {
                result.then(() => callbackItemPromise.resolve(this.result));
                result.catch(result => callbackItemPromise.reject(result));

                return;
            }

            this.passCurrentMyPromiseForward(callbackItemPromise);
        } catch (error) {
            this.handleExecuteCallbackError(callbackItemPromise, error);
        }
    }

    protected executeThenCatchCallback(callbackItem: CallbackItem) {
        const callbackItemPromise = this.callbackItemsPromise.get(callbackItem);

        try {
            const result = callbackItem.callback(this.result);

            if (result instanceof MyPromise) {
                result.then(result => callbackItemPromise.resolve(result));
                result.catch(result => callbackItemPromise.reject(result));

                return;
            }

            callbackItemPromise.resolve(result);
        } catch (error) {
            this.handleExecuteCallbackError(callbackItemPromise, error);
        }
    }

    protected handleExecuteCallbackError(callbackItemPromise: MyPromise, error: Error) {
        setTimeout(() => {
            callbackItemPromise.reject(error);
        });
    }

    protected executeHandlersByOppositeState() {
        const callbackItems = this.getCallbackItemsByOppositeState();

        callbackItems.forEach(callbackItem => {
            const callbackItemPromise = this.callbackItemsPromise.get(callbackItem);

            this.passCurrentMyPromiseForward(callbackItemPromise);
        });
    }

    resolve(result: any) {
        this.state = "resolved";
        this.result = result;

        queueMicrotask(() => {
            this.executeCallbacks();
            this.executeHandlersByOppositeState();
        });
    }

    reject(result: any) {
        if (this.checkCallbackItemsIsEmpty(this))
            throw result;

        this.state = "rejected";
        this.result = result;

        queueMicrotask(() => {
            this.executeCallbacks();
            this.executeHandlersByOppositeState();
        });
    }
}
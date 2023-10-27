"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MyPromise_js_1 = require("./lib/MyPromise.js");
const myPromise = new MyPromise_js_1.default((resolve) => {
    setTimeout(() => {
        resolve(2);
    }, 1000);
});
myPromise
    .then(result => {
    console.log(result);
    return result * 2;
})
    .then(result => {
    console.log(result);
    return new MyPromise_js_1.default((resolve) => setTimeout(() => resolve(result * 2), 1000));
})
    .then(result => {
    console.log(result);
    return result * 2;
})
    .then(result => {
    console.log(result);
    return result * 2;
})
    .catch(error => {
    console.log("error handled", error);
});
console.log("module end");

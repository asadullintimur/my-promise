import MyPromise from "./MyPromise.js";

const myPromise = new MyPromise((resolve, reject) => {
    setTimeout(() => {
        resolve(2)
    }, 1000);
    // setTimeout(() => {
    //     reject(new Error('rejected'))
    // }, 1000);
});

const test =
myPromise
    .finally(() => {
        console.log('finally handler')

        return new MyPromise((resolve, reject) => setTimeout(() => reject(100), 1000));
    })
    .catch(result => {
        console.log('then handler 1')
        return new MyPromise((resolve, reject) => setTimeout(() => reject(result * 2), 500))
    })
    .catch(result => {
        console.log('catch handler 2')
        return new MyPromise(resolve => setTimeout(() => resolve(result * 2), 500))
    })
    .then(result => {
        console.log(result)
    })


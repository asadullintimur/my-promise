import MyPromise from "./MyPromise.js";

const myPromise = new MyPromise((resolve, reject) => {
    setTimeout(() => {
        resolve('val')
    }, 1000);
    // setTimeout(() => {
    //     reject(new Error('rejected'))
    // }, 1000);
});

myPromise.finally(result => {
    console.log('myPromise finally handler', result)
})

myPromise.then(result => {
    console.log('myPromise resolve handler', result)
})

myPromise.catch(error => {
    console.log('myPromise reject handler', error)
})

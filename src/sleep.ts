import { performance } from 'perf_hooks';

export function sleep(sec) {
    const start = performance.now();
    return new Promise(resolve=>{
        setTimeout(resolve, sec * 1000);
    }).then(() => {
        console.log(`sleep: ${sec}s, realTime: ${performance.now()- start}`);
    });
}

export function sleepThrow(sec) {
    const start = performance.now();
    return new Promise(resolve=>{
        setTimeout(resolve, sec * 1000);
    }).then(() => {
        console.log(`sleep & Throw: ${sec}s, realTime: ${performance.now()- start}`);
        throw new Error('Sleep Error');
    })
}

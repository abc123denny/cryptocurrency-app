const isDebug = true;

export const printLog = (str) => {
    if (isDebug) {
        console.log(str);
    }
}
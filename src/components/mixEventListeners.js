
/**
 * @param {{[event:string]:function}[]} args
 * @returns {{[event:string]:function}}
 */
export default function mixEventListeners(...args) {
	let listeners = {};
	for (let obj of args) {
		for (let i in obj) {
			const fns = obj[i].fns;
			
			if (!listeners[i]) {
				listeners[i] = obj[i];
				
				if (Array.isArray(fns)) {
					listeners[i].fns = [...fns];
				}
				else if (typeof fns == "function") {
					listeners[i].fns = [fns];
				}
				else if (fns) {
					throw new TypeError();
				}
			}
			else {
				if (Array.isArray(fns)) {
					listeners[i].fns.push(...fns);
					//listeners[i].fns.push(obj[i]);
				}
				else if (typeof fns == "function") {
					listeners[i].fns.push(fns);
					//listeners[i].fns.push(obj[i]);
				}
				else if (fns) {
					throw new TypeError();
				}
			}
		}
	}
	return listeners;
}

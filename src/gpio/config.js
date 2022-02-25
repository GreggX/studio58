const GPIO = require('onoff').Gpio
import log from "npmlog"

export const configurePort = (n, mode) => {
	if (process.platform === "linux") {
		return new GPIO(n, mode)
	} else {
		log.info("gpio", `Configuring component with pin ${n} and mode ${mode}`)
		return { 
			writeSync: (state) => {
				log.info("gpio", `Writing state ${state}`)
			}
		}
	}
}

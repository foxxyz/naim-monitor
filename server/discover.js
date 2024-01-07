import EventEmitter from 'events'
import ssdp from 'node-ssdp'
import { UPnPDevice } from './device.js'

export class Discovery extends EventEmitter {
    constructor() {
        super()
        this.browser = null
        this.devices = {}
    }
    discover() {
        console.info('Scanning for devices...')
        this.browser = new ssdp.Client()
        this.browser.on('response', this.processDevice.bind(this))
        this.browser.search('ssdp:all')
    }
    async processDevice({ LOCATION }, _, { address }) {
        // Already know about this one, exit
        if (this.devices[address]) return
        // Cache
        this.devices[address] = LOCATION
        const device = await UPnPDevice.detect(LOCATION)
        if (!device) return
        this.emit('device', device)
    }
}

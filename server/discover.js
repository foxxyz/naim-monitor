const EventEmitter = require('events')
const { Client: SSDPClient } = require('node-ssdp')
const { UPnPDevice } = require('./device')

class Discovery extends EventEmitter {
    constructor() {
        super()
        this.browser = null
        this.devices = {}
    }
    discover() {
        console.info('Scanning for devices...')
        this.browser = new SSDPClient()
        this.browser.on('response', this.processDevice.bind(this))
        this.browser.search('ssdp:all')
    }
    async processDevice({ LOCATION }, _, { address }) {
        // Already know about this one, exit
        if (this.devices[address]) return
        const device = await UPnPDevice.detect(LOCATION)
        if (!device) return
        this.emit('device', device)
    }
}

module.exports = {
    Discovery
}
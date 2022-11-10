const EventEmitter = require('events')
const { Client: SSDPClient } = require('node-ssdp')
const { Parser: XMLParser } = require('xml2js')

const xmlParser = new XMLParser()
async function parseUpnpDescription(url) {
    const res = await fetch(url)
    const resText = await res.text()
    const description = await xmlParser.parseStringPromise(resText)
    return description.root.device[0]
}

class NaimDiscover extends EventEmitter {
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
        this.devices[address] = { type: 'Unknown' }
        let res
        try {
            res = await parseUpnpDescription(LOCATION)
        } catch (e) {
            console.error(`Unable to parse description for ${LOCATION}`)
            return
        }
        // Only include Naim devices
        const { friendlyName, manufacturer, modelName, modelNumber } = res
        if (!manufacturer[0].includes('Naim')) {
            delete this.devices[address]
            return
        }
        const device = {
            name: friendlyName[0],
            manufacturer: manufacturer[0],
            modelName: modelName[0],
            modelNumber: modelNumber[0],
            upnpDescription: LOCATION,
            address,
        }
        this.devices[address] = device
        this.emit('device', device)
    }
}

module.exports = NaimDiscover
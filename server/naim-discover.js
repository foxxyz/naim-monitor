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

class NaimDevice extends EventEmitter {
    constructor({ address, descUrl }) {
        super()
        this.address = address
        this.descUrl = descUrl
        this.info = {}
        this.services = []
    }
    get description() {
        return `"${this.info.friendlyName[0]}" (${this.info.modelName[0]} type ${this.info.modelNumber[0]})`
    }
    // Get info on services from uPnP description
    async getInfo() {
        try {
            this.info = await parseUpnpDescription(this.descUrl)
            this.services = this.info.serviceList[0].service
        } catch (e) {
            console.error(`Unable to parse description for ${this.descUrl}`)
        }
    }
    isNaim() {
        if (!this.info.manufacturer) return
        return this.info.manufacturer[0]?.includes('Naim')
    }
    async subscribe({ callbackUrl }) {
        const service = this.services.find(s => s.serviceType[0].includes('AVTransport'))
        // Make uPnP SUBSCRIBE call
        const origin = new URL(this.descUrl).origin
        const url = new URL(service.eventSubURL[0], origin)
        const res = await fetch(url, {
            method: 'SUBSCRIBE',
            headers: {
                HOST: url.host,
                CALLBACK: `<${callbackUrl}/>`,
                NT: 'upnp:event',
                TIMEOUT: 'Second-300',
            }
        })

        if (res.status !== 200) {
            throw new Error(`Unable to subscribe to ${url}, status code ${res.status}!`)
        }
        console.log(res.headers)
        const { sid, timeout } = res.headers
        console.log(sid, timeout)
    }
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
        const device = new NaimDevice({ address, descUrl: LOCATION })
        this.devices[address] = device
        await device.getInfo()
        if (!device.isNaim()) {
            delete this.devices[address]
            return
        }
        this.emit('device', device)
    }
}

module.exports = { NaimDiscover }
const EventEmitter = require('events')
const { Client: SSDPClient } = require('node-ssdp')
const { Parser: XMLParser } = require('xml2js')

const EventReceiver = require('./events')
let GLOBAL_EVENT_RECEIVER

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
        this.currentTrack = {}
        this.descUrl = descUrl
        this.info = {}
        this.services = []
        this.timers = {}
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
    get name() {
        return this.info.friendlyName[0]
    }
    async receive({ name, value }) {
        if (name === 'CurrentTrackMetaData' && value) {
            const packet = await xmlParser.parseStringPromise(value)
            const item = packet['DIDL-Lite'].item[0]
            const metaData = {
                artist: item['upnp:artist'] ? item['upnp:artist'][0] : null,
                trackName: item['dc:title'] ? item['dc:title'][0] : null,
                albumName: item['upnp:album'] ? item['upnp:album'][0] : null,
            }
            Object.assign(this.currentTrack, metaData)
            this.emit('trackChange', this.currentTrack)
            if (!this.currentTrack.artist && !this.currentTrack.trackName) {
                console.info('Stopped Playing.')
            } else {
                console.info(`Now Playing: ${this.currentTrack.artist} - ${this.currentTrack.trackName}\t\t\t\t(${this.currentTrack.trackLength ? this.currentTrack.trackLength : 'Multiroom'}${this.currentTrack.album ? ` / ${this.currentTrack.album}` : ''})`)
            }
        } else if (name === 'CurrentTrackDuration') {
            this.currentTrack.trackLength = value
        }
    }
    async subscribe({ subscriptionID, receiver } = {}) {
        // Use global receiver if none given
        if (!receiver) {
            // Start the global receiver if not started yet
            if (!GLOBAL_EVENT_RECEIVER) {
                GLOBAL_EVENT_RECEIVER = new EventReceiver()
                await GLOBAL_EVENT_RECEIVER.listen()
            }
            receiver = GLOBAL_EVENT_RECEIVER
        }

        // Ensure we know the device info
        if (!this.info.friendlyName) await this.getInfo()

        // Get the AVTransport service
        const service = this.services.find(s => s.serviceType[0].includes('AVTransport'))

        // Make uPnP SUBSCRIBE call
        const origin = new URL(this.descUrl).origin
        const url = new URL(service.eventSubURL[0], origin)

        const headers = {
            HOST: url.host
            //TIMEOUT: 'Second-300',
        }

        // Resubscribe
        if (subscriptionID) {
            headers.SID = subscriptionID
        // New subscription
        } else {
            headers.CALLBACK = `<${receiver.address}/>`
            headers.NT = 'upnp:event'
        }

        // Make request
        let res
        try {
            res = await fetch(url, { method: 'SUBSCRIBE', headers })
        } catch (e) {
            console.error(`Unable to request subscription at ${url}: ${e}. Trying again in 5 seconds...`)
            this.timers.reconnect = setTimeout(this.subscribe.bind(this, { subscriptionID, receiver }), 5000)
            return
        }
        if (res.status !== 200) {
            throw new Error(`Unable to subscribe to ${url}, status code ${res.status}!`)
        }

        // Get new subscription ID
        if (!subscriptionID) {
            subscriptionID = res.headers.get('sid')
            receiver.on(subscriptionID, this.receive.bind(this))
        }

        const timeout = parseInt(res.headers.get('timeout').replace('Second-', ''))
        // Automatically periodically resubscribe before the timeout expires
        this.timers[subscriptionID] = setTimeout(this.subscribe.bind(this, { subscriptionID }), timeout * 1000 * 0.5)
    }
    unsubscribe() {
        for(const subscriptionID in this.timers) {
            clearTimeout(this.timers[subscriptionID])
        }
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

module.exports = {
    NaimDevice,
    NaimDiscover
}
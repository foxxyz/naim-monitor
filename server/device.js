const EventEmitter = require('events')
const { Parser: XMLParser } = require('xml2js')

const EventReceiver = require('./events')
const { formatTime } = require('./util')
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
        this.checkFrequency = 1000
        this.descUrl = descUrl
        this.info = {}
        this.services = []
        this.timers = {}
        this.boundReceive = this.receive.bind(this)
    }
    // Only works on 2nd generation devices
    async checkStatus() {
        const url = `http://${this.address}:15081/nowplaying`
        let res
        try {
            res = await fetch(url)
        } catch (e) {
            console.warn(`Unable to retrieve playing info from ${url}: ${e}`)
            return
        }
        const trackInfo = await res.json()
        const { title: trackName, albumName, artistName: artist, duration } = trackInfo
        const metaData = {
            artist,
            trackName,
            albumName,
            trackLength: formatTime(duration),
        }
        // No change, exit
        if (metaData.trackName === this.currentTrack.trackName && metaData.artist === this.currentTrack.artist) return
        // Emit
        Object.assign(this.currentTrack, metaData)
        this.emit('trackChange', this.currentTrack)
    }
    get description() {
        return `"${this.info.friendlyName[0]}" (${this.info.modelName[0]} type ${this.info.modelNumber[0]})`
    }
    get generation() {
        return this.info.modelNumber[0].endsWith('0034') ? 2 : 1
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
            }
        } else if (name === 'CurrentTrackDuration') {
            this.currentTrack.trackLength = value
        }
    }
    async subscribe({ subscriptionID, receiver } = {}) {
        // Ensure we know the device info
        if (!this.info.friendlyName) await this.getInfo()

        // 2nd generation devices don't use upnp subscriptions, use HTTP GET instead
        if (this.generation === 2) {
            await this.checkStatus()
            this.timers.checkStatus = {
                timer: setTimeout(this.subscribe.bind(this), this.checkFrequency)
            }
            return
        }

        // Use global receiver if none given
        if (!receiver) {
            // Start the global receiver if not started yet
            if (!GLOBAL_EVENT_RECEIVER) {
                GLOBAL_EVENT_RECEIVER = new EventReceiver()
                await GLOBAL_EVENT_RECEIVER.listen()
            }
            receiver = GLOBAL_EVENT_RECEIVER
        }

        // Get the AVTransport service
        const service = this.services.find(s => s.serviceType[0].includes('AVTransport'))

        // Make uPnP SUBSCRIBE call
        const origin = new URL(this.descUrl).origin
        const url = new URL(service.eventSubURL[0], origin)

        const headers = {
            HOST: url.host
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
        // Subscription not available
        if (res.status === 412) {
            console.error(`Unable to subscribe to ${url}, status code ${res.status}!. Trying again in 5 seconds...`)
            // Do not reuse subscription ID
            this.timers.reconnect = { timer: setTimeout(this.subscribe.bind(this, { receiver }), 5000) }
            return
        }
        if (res.status !== 200) {
            console.error(`Unable to subscribe to ${url}, status code ${res.status}!. Trying again in 5 seconds...`)
            this.timers.reconnect = { timer: setTimeout(this.subscribe.bind(this, { subscriptionID, receiver }), 5000) }
            return
        }

        // Get new subscription ID
        if (!subscriptionID) {
            subscriptionID = res.headers.get('sid')
            receiver.on(subscriptionID, this.boundReceive)
        }

        const timeout = parseInt(res.headers.get('timeout').replace('Second-', ''))
        // Automatically periodically resubscribe before the timeout expires
        this.timers[subscriptionID] = {
            receiver,
            timer: setTimeout(this.subscribe.bind(this, { subscriptionID }), timeout * 1000 * 0.5)
        }
    }
    unsubscribe() {
        const tasks = []
        for(const subscriptionID in this.timers) {
            const { receiver, timer } = this.timers[subscriptionID]
            if (receiver) receiver.off(subscriptionID, this.boundReceive)
            clearTimeout(timer)
            // Check if receiver can be closed
            if (receiver && !receiver.eventNames().length) tasks.push(receiver.stop())
        }
        return Promise.all(tasks)
    }
}

module.exports = {
    NaimDevice
}
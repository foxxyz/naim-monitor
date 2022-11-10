const UPnPClient = require('node-upnp')
const { decode } = require('html-entities')
const { Parser: XMLParser } = require('xml2js')
const EventEmitter = require('events')

const { formatTime } = require('./util')

class NAIMUPnPMonitor extends EventEmitter {
    constructor({ host }) {
        super()
        this.host = host
        this.client = new UPnPClient({
            url: host
        })
        this.services = [
            { name: 'AV', urn: 'urn:upnp-org:serviceId:AVTransport' },
            // { name: 'Connection', urn: 'urn:upnp-org:serviceId:ConnectionManager' },
            // { name: 'Render', urn: 'urn:upnp-org:serviceId:RenderingControl' },
        ]
        this.parser = new XMLParser()
        this.currentTrack = {}
    }
    async connect() {
        const desc = await this.client.getDeviceDescription()
        console.success(`✓ Connected to ${desc.friendlyName} (${desc.modelName}) at ${this.host}`)
    }
    async onAVReceive({ name, value }) {
        // Other options:
        // - TransportState [PLAYING, STOPPED]
        if (name === 'CurrentTrackMetaData' && value) {
            const xmlString = decode(value)
            const packet = await this.parser.parseStringPromise(xmlString)
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
                console.info(`Now Playing: ${this.currentTrack.artist} - ${this.currentTrack.trackName}\t\t\t\t(${this.currentTrack.trackLength ? formatTime(this.currentTrack.trackLength) : 'Multiroom'}${this.currentTrack.album ? ` / ${this.currentTrack.album}` : ''})`)
            }
        } else if (name === 'CurrentTrackDuration') {
            this.currentTrack.trackLength = value
        }
    }
    onConnectionReceive(d) {
        console.log('connection', d)
    }
    onRenderReceive(d) {
        console.log('render', d)
    }
    async start() {
        await this.connect()
        const subs = []
        for(const { name, urn } of this.services) {
            this[`_${name}Listener`] = this[`on${name}Receive`].bind(this)
            subs.push(this.client.subscribe(urn, this[`_${name}Listener`]))
        }
        return Promise.all(subs)
    }
    stop() {
        const subs = []
        for(const { name, urn } of this.services) {
            subs.push(this.client.unsubscribe(urn, this[`_${name}Listener`]))
        }
        return Promise.all(subs)
    }
}

module.exports = NAIMUPnPMonitor
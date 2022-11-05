const UPnPClient = require('node-upnp')
const { decode } = require('html-entities')
const { Parser: XMLParser } = require('xml2js')
const EventEmitter = require('events')

class NAIMUPnPMonitor extends EventEmitter {
    constructor({ host }) {
        super()
        this.host = host
        this.client = new UPnPClient({
            url: `http://${this.host}:8080/description.xml`
        })
        this.services = [
            { name: 'AV', urn: 'urn:upnp-org:serviceId:AVTransport' },
            // { name: 'Connection', urn: 'urn:upnp-org:serviceId:ConnectionManager' },
            // { name: 'Render', urn: 'urn:upnp-org:serviceId:RenderingControl' },
        ]
        this.parser = new XMLParser()
    }
    async connect() {
        const desc = await this.client.getDeviceDescription()
        console.success(`✓ Connected to ${desc.friendlyName} (${desc.modelName}) at ${this.host}`)
    }
    async onAVReceive({ name, value }) {
        // Other options:
        // - TransportState [PLAYING, STOPPED]
        if (name === 'CurrentTrackMetaData') {
            const xmlString = decode(value)
            const packet = await this.parser.parseStringPromise(xmlString)
            const item = packet['DIDL-Lite'].item[0]
            console.log(item)
            const metaData = {
                artist: item['upnp:artist'][0],
                trackName: item['dc:title'][0],
                trackLength: item.res[0].$.duration,
                albumName: item['upnp:album'] ? item['upnp:album'][0] : null,
            }
            this.currentTrack = metaData
            this.emit('trackChange', metaData)
            console.info(`Now Playing: ${metaData.artist} - ${metaData.trackName}\t\t\t\t(${metaData.trackLength}${metaData.album ? ` / ${metaData.album}` : ''})`)
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
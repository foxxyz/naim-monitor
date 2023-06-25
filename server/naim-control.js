const { Socket } = require('net')
const { Builder: XMLBuilder, Parser: XMLParser } = require('xml2js')

const XMLStreamTransform = require('./parser')
const { formatTime } = require('./util')

function parsePlayTime(map) {
    const item = map[0].item[0]
    const playTime = parseInt(item.$.int)
    process.stdout.write(`▶️ ${formatTime(playTime)}\r`)
}

function parsePlayItem(map) {
    const title = map[0].item.find(node => node.$?.name === 'title')
    console.info(`Now playing: ${title.$.string}`)
}

class NAIMController {
    constructor(host) {
        this.client = new Socket()
        this.client.connect(15555, host, this.onConnect.bind(this))
        const parser = new XMLStreamTransform()
        this.client.pipe(parser)
        parser.on('data', this.onReceive.bind(this))
        this.pingInterval = setInterval(this.ping.bind(this), 3000)
        this.transactionID = 0
        this.xmlParser = new XMLParser()
        this.xmlBuilder = new XMLBuilder({ headless: true })
    }
    generateCommand(name) {
        const command = {
            name,
            id: this.transactionID++
        }
        return this.xmlBuilder.buildObject({ command })
    }
    onConnect() {
        console.info('Connected!')
    }
    async onReceive(data) {
        // console.debug(data.toString())
        // console.warn('-----END PACKET')
        const packet = await this.xmlParser.parseStringPromise(data.toString())
        console.log(packet)
        if (packet.event) {
            switch (packet.event.$.name) {
                case 'GetNowPlayingTime':
                    parsePlayTime(packet.event.map)
                    break
                case 'GetNowPlaying':
                    parsePlayItem(packet.event.map)
                    break
            }
        }
    }
    ping() {
        console.log(this.generateCommand('ping'))
        this.client.write(this.generateCommand('ping'))
    }
}

module.exports = NAIMController
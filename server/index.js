#!/usr/bin/env node
const concat = require('concat-stream')
const { createServer } = require('http')
const { ipv4 } = require('network-address')
const { Server: WSServer } = require('ws-plus')
const { Parser: XMLParser } = require('xml2js')
require('fresh-console')
const { ArgumentParser, ArgumentDefaultsHelpFormatter, SUPPRESS } = require('argparse')
const packageInfo = require('./package.json')

//const NaimMonitor = require('./naim-upnp')
const { NaimDiscover } = require('./naim-discover')

// new NAIMDevice(args.naim_host)

// Parse arguments
// eslint-disable-next-line
const parser = new ArgumentParser({ add_help: true, description: packageInfo.description, formatter_class: ArgumentDefaultsHelpFormatter })
parser.add_argument('-v', { action: 'version', version: packageInfo.version })
parser.add_argument('--ws-host', { help: 'Websocket Host', default: '127.0.0.1' })
parser.add_argument('--ws-port', { help: 'Websocket Port', default: 8090 })
parser.add_argument('--naim-host', { help: 'IP/Host of Naim speaker to monitor (omit to autodiscover)', default: SUPPRESS })
const args = parser.parse_args()

const wsServer = new WSServer({ host: args.ws_host, port: args.ws_port })

let eventReceiver
class EventReceiver {
    constructor() {
        this.parser = new XMLParser()
        this.server = createServer(req => req.pipe(concat(this.receive.bind(this, req))))
    }
    get address() {
        const { address, port } = this.server.address()
        return `http://${address}:${port}`
    }
    listen() {
        return new Promise(res => this.server.listen(0, ipv4(), res))
    }
    async receive(req, buffer) {
        const serviceId = req.headers.sid
        const packet = await this.parser.parseStringPromise(buffer.toString())
        const props = packet['e:propertyset']['e:property']
        console.log(serviceId, props)
    }
}

const browser = new NaimDiscover()
browser.discover()
browser.on('device', async device => {
    console.success(`Found ${device.description} at ${device.address}`)

    // Create events receiver if we don't have one
    if (!eventReceiver) {
        eventReceiver = new EventReceiver()
        await eventReceiver.listen()
    }

    // Subscribe
    device.subscribe({ callbackUrl: eventReceiver.address })

    // const monitor = new NaimMonitor(device)
    // monitor.start()
    // // Emit track changes
    // monitor.on('trackChange', wsServer.broadcast.bind(wsServer, 'trackChange'))
    // wsServer.on('connect', client => {
    //     client.send('trackChange', monitor.currentTrack)
    // })
})

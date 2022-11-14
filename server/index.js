#!/usr/bin/env node
const { Server: WSServer } = require('ws-plus')
require('fresh-console')
const { ArgumentParser, ArgumentDefaultsHelpFormatter, SUPPRESS } = require('argparse')
const packageInfo = require('./package.json')

//const NaimMonitor = require('./naim-upnp')
const { NaimDiscover } = require('./naim-discover')
const EventReceiver = require('./events')

// new NAIMDevice(args.naim_host)

// Parse arguments
// eslint-disable-next-line
const parser = new ArgumentParser({ add_help: true, description: packageInfo.description, formatter_class: ArgumentDefaultsHelpFormatter })
parser.add_argument('-v', { action: 'version', version: packageInfo.version })
parser.add_argument('--ws-host', { help: 'Websocket Host', default: '127.0.0.1' })
parser.add_argument('--ws-port', { help: 'Websocket Port', default: 8090 })
parser.add_argument('--naim-host', { help: 'IP/Host of Naim speaker to monitor (omit to autodiscover)', default: SUPPRESS })
const args = parser.parse_args()

async function main() {
    const wsServer = new WSServer({ host: args.ws_host, port: args.ws_port })

    // Start event receiving server
    const eventReceiver = new EventReceiver()
    await eventReceiver.listen()

    const browser = new NaimDiscover()
    browser.discover()
    browser.on('device', async device => {
        console.success(`Found ${device.description} at ${device.address}`)

        // Subscribe
        device.subscribe({ receiver: eventReceiver })

        // Emit track changes
        device.on('trackChange', track => {
            wsServer.broadcast('trackChange', { device: device.name, ...track })
        })
        wsServer.on('connect', client => {
            client.send('trackChange', { device: device.name, ...device.currentTrack })
        })
    })
}

main()
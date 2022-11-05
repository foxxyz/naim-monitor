#!/usr/bin/env node
const { Server: WSServer } = require('ws-plus')
require('fresh-console')
const { ArgumentParser, ArgumentDefaultsHelpFormatter, SUPPRESS } = require('argparse')
const packageInfo = require('./package.json')

const NAIMMonitor = require('./naim-upnp')

// new NAIMDevice(args.naim_host)

// Parse arguments
// eslint-disable-next-line
const parser = new ArgumentParser({ add_help: true, description: packageInfo.description, formatter_class: ArgumentDefaultsHelpFormatter })
parser.add_argument('-v', { action: 'version', version: packageInfo.version })
parser.add_argument('--ws-host', { help: 'Websocket Host', default: '127.0.0.1' })
parser.add_argument('--ws-port', { help: 'Websocket Port', default: 8090 })
parser.add_argument('--naim-host', { help: 'IP/Host of Naim speaker to monitor', required: true, default: SUPPRESS })
const args = parser.parse_args()

const wsServer = new WSServer({ host: args.ws_host, port: args.ws_port })

const monitor = new NAIMMonitor({ host: args.naim_host })
monitor.start()
// Emit track changes
monitor.on('trackChange', wsServer.broadcast.bind(wsServer, 'trackChange'))
wsServer.on('connect', client => {
    client.send('trackChange', monitor.currentTrack)
})
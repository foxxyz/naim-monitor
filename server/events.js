const concat = require('concat-stream')
const EventEmitter = require('events')
const { createServer } = require('http')
const { ipv4 } = require('network-address')
const { Parser: XMLParser } = require('xml2js')

class EventReceiver extends EventEmitter {
    constructor() {
        super()
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
        const eventXML = props[0].LastChange[0]
        const event = await this.parser.parseStringPromise(eventXML)
        const instanceEvent = event.Event.InstanceID[0]
        for(const name in instanceEvent) {
            // Skip attributes for instance (usually just "val=0")
            if (name === '$') continue
            const value = instanceEvent[name][0].$.val
            if (value === 'NOT_IMPLEMENTED') continue
            this.emit(serviceId, { name, value })
        }
    }
}

module.exports = EventReceiver
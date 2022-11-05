const { Transform } = require('stream')

// Parser to mend incoming TCP packets for valid XML
class XMLParser extends Transform {
    constructor(args) {
        super(args)
        this.buffer = Buffer.alloc(0)
    }
    _transform(chunk, encoding, cb) {
        this.buffer = Buffer.concat([this.buffer, chunk])
        let message = this.buffer.toString().replaceAll('\n', '').replaceAll('\t', '')
        while(message.length) {
            const [, firstTag] = message.match('^<([^ >]+)')
            const endTag = `</${firstTag}>`
            const packetEnd = message.indexOf(endTag)
            // Make sure ending tags are present
            if (packetEnd === -1) return cb()
            this.push(message.slice(0, packetEnd + endTag.length))
            message = message.slice(packetEnd + endTag.length)
        }
        this.buffer = Buffer.alloc(0)
        cb()
    }
    _flush(cb) {
        this.push(this.buffer, 'utf8')
        this.buffer = Buffer.alloc(0)
        cb()
    }
}

module.exports = XMLParser
const { join } = require('path')
const { readFile } = require('fs/promises')
const { createServer } = require('http')

const { Discovery } = require('../discover')

class MockDevice {
    constructor(descFile) {
        this.descFile = descFile
        this.server = createServer(this.receive.bind(this))
        this.server.on('connection', socket => this.socket = socket)
    }
    get address() {
        return this.server.address().address
    }
    receive(req, res) {
        if (req.url === '/description.xml') {
            res.end(this.upnpDesc)
        }
    }
    async start() {
        // Use sample upnp description
        this.upnpDesc = await readFile(join(__dirname, this.descFile), 'utf8')
        await new Promise(res => this.server.listen(0, '127.0.0.1', res))
        const { address, port } = this.server.address()
        this.ssdp = {
            'CACHE-CONTROL': 'max-age=1800',
            EXT: '',
            LOCATION: `http://${address}:${port}/description.xml`,
            SERVER: 'KnOS/3.2 UPnP/1.0 DMP/3.5',
            ST: 'uuid:5F9EC1B3-ED59-79BB-4530-FF88FF88FF88',
            USN: 'uuid:5F9EC1B3-ED59-79BB-4530-FF88FF88FF88'
        }
    }
    async stop() {
        this.socket.destroy()
        await new Promise(res => this.server.close(res))
    }
}

describe('Scanner', () => {
    it('can recognize a Naim device from uPnP description', async() => {
        const discoverer = new Discovery()
        const fn = jest.fn()
        discoverer.on('device', fn)
        const mockDevice = new MockDevice('sample_naim_desc.xml')
        await mockDevice.start()
        await discoverer.processDevice(mockDevice.ssdp, 200, { address: mockDevice.address })
        await mockDevice.stop()
        expect(fn).toHaveBeenCalled()
    })
    it('only reports devices once', async() => {
        const discoverer = new Discovery()
        const fn = jest.fn()
        discoverer.on('device', fn)
        const mockDevice = new MockDevice('sample_naim_desc.xml')
        await mockDevice.start()
        await Promise.all([
            discoverer.processDevice(mockDevice.ssdp, 200, { address: mockDevice.address }),
            discoverer.processDevice(mockDevice.ssdp, 200, { address: mockDevice.address }),
        ])
        await mockDevice.stop()
        expect(fn).toHaveBeenCalledTimes(1)
    })
    it('rejects non-Naim devices', async() => {
        const discoverer = new Discovery()
        const fn = jest.fn()
        discoverer.on('device', fn)
        const mockDevice = new MockDevice('sample_lg_desc.xml')
        await mockDevice.start()
        await discoverer.processDevice(mockDevice.ssdp, 200, { address: mockDevice.address })
        await mockDevice.stop()
        expect(fn).not.toHaveBeenCalled()
    })
})

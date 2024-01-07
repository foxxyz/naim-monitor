import assert from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { MockDeviceGen1, MockDeviceGen2 } from './mocks.js'
import { NaimGen1Device, NaimGen2Device } from '../device.js'

const SERVICES_GEN_1 = [
    {
        serviceType: ['urn:schemas-upnp-org:service:RenderingControl:1'],
        serviceId: ['urn:upnp-org:serviceId:RenderingControl'],
        SCPDURL: ['/RenderingControl/desc.xml'],
        controlURL: ['/RenderingControl/ctrl'],
        eventSubURL: ['/RenderingControl/evt']
    },
    {
        serviceType: ['urn:schemas-upnp-org:service:ConnectionManager:1'],
        serviceId: ['urn:upnp-org:serviceId:ConnectionManager'],
        SCPDURL: ['/ConnectionManager/desc.xml'],
        controlURL: ['/ConnectionManager/ctrl'],
        eventSubURL: ['/ConnectionManager/evt']
    },
    {
        serviceType: ['urn:schemas-upnp-org:service:AVTransport:1'],
        serviceId: ['urn:upnp-org:serviceId:AVTransport'],
        SCPDURL: ['/AVTransport/desc.xml'],
        controlURL: ['/AVTransport/ctrl'],
        eventSubURL: ['/AVTransport/evt']
    }
]

describe('Monitor (Gen 1 Devices)', () => {
    let fakeDevice
    beforeEach(async() => {
        fakeDevice = new MockDeviceGen1('sample_naim_desc.xml')
        await fakeDevice.start()
    })
    afterEach(async() => {
        await fakeDevice.stop()
    })
    it('can subscribe to receive playback updates', async() => {
        const fn = mock.fn()

        const device = new NaimGen1Device({
            address: new URL(`http://${fakeDevice.host}/description.xml`),
            name: 'Gen 1 Mu-so',
            modelNumber: '20-004-0007',
            modelName: 'Mu-so',
            services: SERVICES_GEN_1,
        })
        device.on('trackChange', fn)
        await device.subscribe()

        await fakeDevice.switchTrack({
            artist: 'Princess',
            trackName: 'I Would Lie 4U',
            trackDuration: 260,
            albumName: 'Turquoise Rain',
        })

        await new Promise(res => setTimeout(res, 10))

        await device.unsubscribe()

        assert.deepEqual(fn.mock.calls[0].arguments[0], {
            artist: 'Princess',
            albumName: 'Turquoise Rain',
            trackName: 'I Would Lie 4U',
            trackLength: '04:20',
        })
    })
    it('shows descriptions', () => {
        const device = new NaimGen1Device({
            address: new URL(`http://${fakeDevice.host}/description.xml`),
            name: 'Bedroom',
            modelNumber: '20-004-0007',
            modelName: 'Mu-so',
            services: SERVICES_GEN_1,
        })
        assert.equal(device.description, '"Bedroom" (Mu-so type 20-004-0007)')
    })
})

const SERVICES_GEN_2 = [
    {
        serviceType: ['urn:schemas-upnp-org:service:ConnectionManager:2'],
        serviceId: ['urn:upnp-org:serviceId:ConnectionManager'],
        SCPDURL: ['/xml/ConnectionManager.xml'],
        controlURL: ['/Control/LibRygelRenderer/RygelSinkConnectionManager'],
        eventSubURL: ['/Event/LibRygelRenderer/RygelSinkConnectionManager']
    },
    {
        serviceType: ['urn:schemas-upnp-org:service:AVTransport:2'],
        serviceId: ['urn:upnp-org:serviceId:AVTransport'],
        SCPDURL: ['/xml/AVTransport2.xml'],
        controlURL: ['/Control/LibRygelRenderer/RygelAVTransport'],
        eventSubURL: ['/Event/LibRygelRenderer/RygelAVTransport']
    },
    {
        serviceType: ['urn:schemas-upnp-org:service:RenderingControl:2'],
        serviceId: ['urn:upnp-org:serviceId:RenderingControl'],
        SCPDURL: ['/xml/RenderingControl2.xml'],
        controlURL: ['/Control/LibRygelRenderer/RygelRenderingControl'],
        eventSubURL: ['/Event/LibRygelRenderer/RygelRenderingControl']
    }
]

describe('Monitor (Gen 2 Devices)', () => {
    let fakeDevice
    beforeEach(async() => {
        fakeDevice = new MockDeviceGen2('sample_naim_2_desc.xml', 'f41662fe-fa97-4371-8bc9-88ff88ff88ff')
        await fakeDevice.start()
    })
    afterEach(async() => {
        await fakeDevice.stop()
    })
    it('can subscribe to receive playback updates', async() => {
        const fn = mock.fn()

        const device = new NaimGen2Device({
            address: new URL(`http://${fakeDevice.host}/f41662fe-fa97-4371-8bc9-88ff88ff88ff.xml`),
            name: 'Gen 2 Mu-so Qb',
            modelNumber: '20-004-0034',
            modelName: 'Mu-so Qb',
            services: SERVICES_GEN_2
        })
        // 5ms check to increase test time
        device.checkFrequency = 5

        device.on('trackChange', fn)
        await device.subscribe()

        await fakeDevice.switchTrack({
            artist: 'Princess',
            trackName: 'I Would Lie 4U',
            trackDuration: 260,
            albumName: 'Turquoise Rain',
        })

        await new Promise(res => setTimeout(res, 10))

        await device.unsubscribe()

        assert.deepEqual(fn.mock.calls[0].arguments[0], {
            artist: 'Princess',
            albumName: 'Turquoise Rain',
            trackName: 'I Would Lie 4U',
            trackLength: '04:20',
        })
    })
    it('shows descriptions', () => {
        const device = new NaimGen1Device({
            address: new URL(`http://${fakeDevice.host}/f41662fe-fa97-4371-8bc9-88ff88ff88ff.xml`),
            name: 'Bedroom',
            modelNumber: '20-004-0034',
            modelName: 'Mu-so Qb',
            services: SERVICES_GEN_1,
        })
        assert.equal(device.description, '"Bedroom" (Mu-so Qb type 20-004-0034)')
    })
})
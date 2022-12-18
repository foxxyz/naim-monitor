const { MockDeviceGen1, MockDeviceGen2 } = require('./mocks')
const { NaimDevice } = require('../naim-discover')

describe('Monitor (Gen 1 Devices)', () => {
    it('can subscribe to receive playback updates', async() => {
        const fakeDevice = new MockDeviceGen1('sample_naim_desc.xml')
        await fakeDevice.start()

        const fn = jest.fn()

        const device = new NaimDevice({
            address: fakeDevice.address,
            descUrl: `http://${fakeDevice.host}/description.xml`
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

        await fakeDevice.stop()
        await device.unsubscribe()

        expect(fn).toHaveBeenCalledWith({
            artist: 'Princess',
            albumName: 'Turquoise Rain',
            trackName: 'I Would Lie 4U',
            trackLength: '04:20',
        })
    })
})

describe('Monitor (Gen 2 Devices)', () => {
    it('can subscribe to receive playback updates', async() => {
        const fakeDevice = new MockDeviceGen2('sample_naim_2_desc.xml', 'f41662fe-fa97-4371-8bc9-88ff88ff88ff')
        await fakeDevice.start()

        const fn = jest.fn()

        const device = new NaimDevice({
            address: fakeDevice.address,
            descUrl: `http://${fakeDevice.host}/f41662fe-fa97-4371-8bc9-88ff88ff88ff.xml`
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

        await fakeDevice.stop()
        await device.unsubscribe()

        expect(fn).toHaveBeenCalledWith({
            artist: 'Princess',
            albumName: 'Turquoise Rain',
            trackName: 'I Would Lie 4U',
            trackLength: '04:20',
        })
    })
})
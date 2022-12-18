const { MockDeviceGen1 } = require('./mocks')
const { NaimDevice } = require('../naim-discover')

describe('Monitor', () => {
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
            trackDuration: '0:04:20',
            albumName: 'Turquoise Rain',
        })

        await fakeDevice.stop()
        await device.unsubscribe()

        expect(fn).toHaveBeenCalledWith({
            artist: 'Princess',
            albumName: 'Turquoise Rain',
            trackName: 'I Would Lie 4U',
            trackLength: '0:04:20',
        })
    })
})
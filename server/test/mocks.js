import { join } from 'path'
import { readFile } from 'fs/promises'
import { createServer } from 'http'
import { fileURLToPath } from 'url'

import { formatTime } from '../util.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export class MockDeviceGen1 {
    constructor(descFile) {
        this.descFile = descFile
        this.server = createServer(this.receive.bind(this))
        this.server.on('connection', socket => this.socket = socket)
    }
    get address() {
        return this.server.address().address
    }
    get host() {
        const { address, port } = this.server.address()
        return `${address}:${port}`
    }
    receive(req, res) {
        if (req.url === '/description.xml') {
            return res.end(this.upnpDesc)
        }
        if (req.url === '/AVTransport/evt') {
            this.callBackURL = req.headers.callback.slice(1, -1)
            this.sid = 'uuid:12345678-217d-156b-8d90-aabbccddeeff'
            res.setHeader('SERVER', 'KnOS/3.2 UPnP/1.0 DMP/3.5')
            res.setHeader('SID', this.sid)
            res.setHeader('TIMEOUT', 'Second-300')
            return res.end()
        }
    }
    async start() {
        // Use sample upnp description
        this.upnpDesc = await readFile(join(__dirname, this.descFile), 'utf8')
        await new Promise(res => this.server.listen(0, '127.0.0.1', res))
        this.ssdp = {
            'CACHE-CONTROL': 'max-age=1800',
            EXT: '',
            LOCATION: `http://${this.host}/description.xml`,
            SERVER: 'KnOS/3.2 UPnP/1.0 DMP/3.5',
            ST: 'uuid:5F9EC1B3-ED59-79BB-4530-FF88FF88FF88',
            USN: 'uuid:5F9EC1B3-ED59-79BB-4530-FF88FF88FF88'
        }
    }
    async switchTrack({ artist, trackName, trackDuration, albumName }) {
        if (!this.callBackURL) return
        const itemURI = 'http://127.0.0.1/test.flac'
        const format = 'audio/x-flac'
        const albumArtURL = 'http://127.0.0.1/folder.jpg'
        const body = `<e:propertyset xmlns:e="urn:schemas-upnp-org:event-1-0">
              <e:property>
                <LastChange>&lt;Event xmlns=&quot;urn:schemas-upnp-org:metadata-1-0/AVT/&quot;&gt;
              &lt;InstanceID val=&quot;0&quot;&gt;
                &lt;TransportState val=&quot;PLAYING&quot;/&gt;
                &lt;TransportStatus val=&quot;OK&quot;/&gt;
                &lt;PlaybackStorageMedium val=&quot;NETWORK&quot;/&gt;
                &lt;RecordStorageMedium val=&quot;NOT_IMPLEMENTED&quot;/&gt;
                &lt;PossiblePlaybackStorageMedia val=&quot;NETWORK&quot;/&gt;
                &lt;PossibleRecordStorageMedia val=&quot;NOT_IMPLEMENTED&quot;/&gt;
                &lt;CurrentPlayMode val=&quot;NORMAL&quot;/&gt;
                &lt;TransportPlaySpeed val=&quot;1&quot;/&gt;
                &lt;RecordMediumWriteStatus val=&quot;NOT_IMPLEMENTED&quot;/&gt;
                &lt;CurrentRecordQualityMode val=&quot;NOT_IMPLEMENTED&quot;/&gt;
                &lt;PossibleRecordQualityModes val=&quot;NOT_IMPLEMENTED&quot;/&gt;
                &lt;NumberOfTracks val=&quot;1&quot;/&gt;
                &lt;CurrentTrack val=&quot;1&quot;/&gt;
                &lt;CurrentTrackDuration val=&quot;${formatTime(trackDuration * 1000)}&quot;/&gt;
                &lt;CurrentMediaDuration val=&quot;${formatTime(trackDuration * 1000)}&quot;/&gt;
                &lt;CurrentTrackMetaData val=&quot;&amp;lt;DIDL-Lite xmlns=&amp;quot;urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/&amp;quot; xmlns:dc=&amp;quot;http://purl.org/dc/elements/1.1/&amp;quot; xmlns:upnp=&amp;quot;urn:schemas-upnp-org:metadata-1-0/upnp/&amp;quot;&amp;gt;&amp;lt;item&amp;gt;&amp;lt;dc:title&amp;gt;${trackName}&amp;lt;/dc:title&amp;gt;&amp;lt;upnp:artist&amp;gt;${artist}&amp;lt;/upnp:artist&amp;gt;&amp;lt;upnp:genre&amp;gt;Indie&amp;lt;/upnp:genre&amp;gt;&amp;lt;upnp:album&amp;gt;${albumName}&amp;lt;/upnp:album&amp;gt;&amp;lt;upnp:albumArtURI&amp;gt;${albumArtURL}&amp;lt;/upnp:albumArtURI&amp;gt;&amp;lt;res duration=&amp;quot;${trackDuration}&amp;quot; protocolInfo=&amp;quot;http-get:*:${format}:*&amp;quot;&amp;gt;${itemURI}&amp;lt;/res&amp;gt;&amp;lt;/item&amp;gt;&amp;lt;/DIDL-Lite&amp;gt;&quot;/&gt;
                &lt;CurrentTrackURI val=&quot;${itemURI}&quot;/&gt;
                &lt;AVTransportURI val=&quot;${itemURI}&quot;/&gt;
                &lt;AVTransportURIMetaData val=&quot;&amp;lt;DIDL-Lite xmlns=&amp;quot;urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/&amp;quot; xmlns:dc=&amp;quot;http://purl.org/dc/elements/1.1/&amp;quot; xmlns:upnp=&amp;quot;urn:schemas-upnp-org:metadata-1-0/upnp/&amp;quot;&amp;gt;&amp;lt;item&amp;gt;&amp;lt;dc:title&amp;gt;${trackName}&amp;lt;/dc:title&amp;gt;&amp;lt;upnp:artist&amp;gt;${artist}&amp;lt;/upnp:artist&amp;gt;&amp;lt;upnp:genre&amp;gt;Indie&amp;lt;/upnp:genre&amp;gt;&amp;lt;upnp:album&amp;gt;${albumName}&amp;lt;/upnp:album&amp;gt;&amp;lt;upnp:albumArtURI&amp;gt;${albumArtURL}&amp;lt;/upnp:albumArtURI&amp;gt;&amp;lt;res duration=&amp;quot;${trackDuration}&amp;quot; protocolInfo=&amp;quot;http-get:*:${format}:*&amp;quot;&amp;gt;${itemURI}&amp;lt;/res&amp;gt;&amp;lt;/item&amp;gt;&amp;lt;/DIDL-Lite&amp;gt;&quot;/&gt;
                &lt;NextAVTransportURI val=&quot;&quot;/&gt;
                &lt;NextAVTransportURIMetaData val=&quot;&quot;/&gt;
                &lt;CurrentTransportActions val=&quot;Pause,Stop,Next,Previous&quot;/&gt;
              &lt;/InstanceID&gt;
            &lt;/Event&gt;</LastChange>
              </e:property>
            </e:propertyset>`
        const headers = {
            HOST: this.address,
            'CONTENT-TYPE': 'text/xml;charset="utf-8"',
            NT: 'upnp:event',
            NTS: 'upnp:propchange',
            SID: this.sid,
            SEQ: 0
        }
        await fetch(this.callBackURL, {
            method: 'NOTIFY',
            headers,
            body
        })
    }
    async stop() {
        if (this.socket) this.socket.destroy()
        await new Promise(res => this.server.close(res))
    }
}

export class MockDeviceGen2 extends MockDeviceGen1 {
    constructor(descFile, uuid) {
        super(descFile)
        this.uuid = uuid
        this.cmdServer = createServer(this.receiveCmdReq.bind(this))
        this.cmdServer.on('connection', socket => this.cmdSocket = socket)
    }
    receive(req, res) {
        if (req.url === `/${this.uuid}.xml`) {
            return res.end(this.upnpDesc)
        }
    }
    receiveCmdReq(req, res) {
        if (req.url === '/nowplaying') {
            const trackInfo = {
                version: '1.4.0',
                changestamp: 0,
                name: 'Now Playing',
                ussi: 'nowplaying',
                class: 'object.nowplaying',
                albumName: this.albumName,
                artistName: this.artist,
                bitDepth: 16,
                canResume: 1,
                channels: 2,
                codec: 'FLAC',
                contentTag: 28,
                cpu: 352,
                description: 'Test description',
                duration: this.trackDuration,
                error: 0,
                live: 0,
                mimeType: 'audio/x-flac',
                repeat: 0,
                restrictPause: 0,
                restrictPeekNext: 0,
                restrictPeekPrev: 0,
                restrictResume: 0,
                restrictSeek: 0,
                restrictSkipNext: 0,
                restrictSkipPrev: 0,
                restrictStop: 0,
                sampleRate: 44100,
                shuffle: 0,
                source: 'inputs/playqueue',
                sourceDetail: 'upnp',
                sourceMultiroom: 'inputs/none',
                streamDomain: '',
                streamMessage: '',
                title: this.trackName,
                transportPosition: 0,
                transportState: 2
            }
            res.setHeader('Etag', '3p_o17-rzeRoPQLOhJsq')
            return res.end(JSON.stringify(trackInfo))
        }
    }
    async start() {
        await super.start()
        await new Promise(res => this.cmdServer.listen(15081, '127.0.0.1', res))
        this.ssdp = {
            'CACHE-CONTROL': 'max-age=1800',
            EXT: '',
            LOCATION: `http://${this.host}/${this.uuid}.xml`,
            SERVER: 'Linux/4.1.15 UPnP/1.0 GUPnP/0.20.14',
            ST: 'upnp:rootdevice',
            USN: `uuid:${this.uuid}::upnp:rootdevice`,
        }
    }
    async stop() {
        await super.stop()
        if (this.cmdSocket) this.cmdSocket.destroy()
        await new Promise(res => this.cmdServer.close(res))
    }
    switchTrack({ artist, trackName, trackDuration, albumName }) {
        this.artist = artist
        this.trackName = trackName
        this.trackDuration = trackDuration * 1000
        this.albumName = albumName
    }
}
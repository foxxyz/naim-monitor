<template>
    <main class="home">
        <div class="album-art">
            <div class="album-art-wrapper">
                <img v-if="albumArt" :src="albumArt">
                <div v-else class="art-loading" />
                <div v-if="loading" class="meta">
                    <p>Awaiting Playback Info...</p>
                </div>
                <div v-else class="meta">
                    <h1>{{ track.artist }}</h1>
                    <h2>{{ track.trackName }}</h2>
                    <h4>{{ track.albumName }}</h4>
                </div>
            </div>
        </div>
        <div class="device">
            {{ device.name }}
        </div>
    </main>
</template>

<script setup>
import { getAlbumImage } from 'album-image'
import randomColor from 'randomcolor'
import { reactive, ref, watch } from 'vue'
import { listen } from 'ws-plus/vue'

const loading = ref(true)
const albumArt = ref()
const track = reactive({
    artist: 'Unknown Artist',
    trackName: 'Unknown Track',
    trackLength: 0,
    albumName: 'Unknown Album'
})

const device = reactive({
    name: ''
})

let aborter
async function loadAlbumArt({ artist, albumName }) {
    // Abort previous request if needed
    if (aborter) aborter.abort('Aborted')

    // Create a new aborter
    aborter = new AbortController()
    const signal = aborter.signal

    let src
    try {
        src = await getAlbumImage({ artist, album: albumName, signal })
    } catch (e) {
        if (e === 'Aborted') return
        console.warn(`No album art results for ${artist} and/or ${albumName}!`)
    }
    albumArt.value = src
}

listen({
    trackChange(info) {
        // Skip if no artist given
        if (!info.artist) return
        // Same track called for possibly a different device - ignore
        if (info.artist === track.artist && info.trackName === track.trackName) return

        // Try getting album art
        if (info.artist !== track.artist || info.albumName !== track.albumName) {
            // Load asychronously
            loadAlbumArt(info)
        }
        Object.assign(track, info)
        device.name = info.device
        loading.value = false
        // Set body background so it works with Apple's apple-mobile-web-app-status-bar-style
        document.body.style.backgroundColor = randomColor()
    }
})

// Update title on track change
watch(track, ({ artist, trackName }) => {
    document.title = `${trackName} - ${artist} 🎵`
})

</script>

<style lang="sass">
@property --angle
    syntax: '<angle>'
    inherits: false
    initial-value: 180deg

main.home
    display: flex
    justify-content: center
    align-items: center
    height: 100%
    transition: background 2s ease-in-out
    color: white
    perspective: 200vmin
    &:before
        content: ''
        position: absolute
        width: 100%
        height: 100%
        top: 0
        left: 0
        background: linear-gradient(to bottom, transparent, #000)

    .album-art
        animation: showoffX 8.1s ease-in-out infinite alternate
        aspect-ratio: 1/1
        perspective: inherit
        width: 80vmin
        img
            width: 100%
            height: 100%
            display: block
            object-fit: cover
            opacity: .8

    .album-art-wrapper
        transform-style: preserve-3d
        animation: showoffY 8s ease-in-out infinite alternate
        display: flex
        justify-content: center
        align-items: center
        height: 100%
        background-color: #111
        box-shadow: .1em .1em .5em rgba(0, 0, 0, .9)

    .art-loading
        background: conic-gradient(from var(--angle), black, #222)
        width: 100%
        height: 100%
        animation: loading-gradient 2s infinite linear

    .device
        position: absolute
        right: 0
        top: 0
        padding: .5em
        opacity: .3
        font-size: .7em
        font-weight: 300
        text-transform: lowercase
        background: rgba(0, 0, 0, .4)
        border-bottom-left-radius: .5em
        display: flex
        align-items: center
        &:before
            content: '\f8df'
            font-family: Icons
            margin-right: .5em
            display: block
    .meta
        position: absolute
        height: 100%
        width: 100%
        padding: 1em
        display: flex
        flex-direction: column
        align-items: flex-start
        justify-content: flex-end

    h1
        font-size: 2.5em
        letter-spacing: -.05em
        font-weight: 900
        text-transform: uppercase
        line-height: .8em
        text-shadow: .05em .05em .1em rgba(0, 0, 0, .5)
    h2
        letter-spacing: -.05em
        font-weight: 500
        text-transform: uppercase
        font-size: 1.5em
        text-shadow: .05em .05em .1em rgba(0, 0, 0, .5)

    h4
        font-weight: 100
        transform: translate(0, 2.5em)
        white-space: nowrap
        overflow: hidden
        width: 100%
        text-overflow: ellipsis

    p
        text-align: center
        margin-bottom: 1em
        font-size: .8em

@keyframes showoffX
    0%
        transform: rotateX(-10deg)
    100%
        transform: rotateX(10deg)

@keyframes showoffY
    0%
        transform: rotateY(-10deg)
    100%
        transform: rotateY(10deg)

@keyframes loading-gradient
    from
        --angle: 0deg
    to
        --angle: 360deg
</style>

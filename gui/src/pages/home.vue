<template>
    <main class="home" :style="{ backgroundColor: color }">
        <div class="album-art">
            <div class="album-art-wrapper">
                <img v-if="albumArt" :src="albumArt">
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
    </main>
</template>

<script setup>
import fetchAlbumArt from 'album-art'
import randomColor from 'randomcolor'
import { reactive, ref } from 'vue'
import { listen } from 'ws-plus/vue'

const loading = ref(true)
const albumArt = ref()
const color = ref('#40e0d0')
const track = reactive({
    artist: 'Unknown Artist',
    trackName: 'Unknown Track',
    trackLength: 0,
    albumName: 'Unknown Album'
})

listen({
    async trackChange(info) {
        const options = { size: 'large' }
        if (info.albumName) options.album = info.albumName
        let src = await fetchAlbumArt(info.artist, options)
        // Try without album if no results
        if (src instanceof Error) {
            src = await fetchAlbumArt(info.artist, { size: 'large' })
        }
        if (src instanceof Error) src = null
        albumArt.value = src
        Object.assign(track, info)
        color.value = randomColor()
        loading.value = false
    }
})

</script>

<style lang="sass">
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
        text-shadow: .1em .1em .3em rgba(0, 0, 0, 1)
    h2
        letter-spacing: -.05em
        font-weight: 500
        text-transform: uppercase
        font-size: 1.5em
        text-shadow: .1em .1em .3em rgba(0, 0, 0, 1)

    h4
        text-shadow: .1em .1em .3em rgba(0, 0, 0, 1)
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
        transform: rotateX(-5deg)
    100%
        transform: rotateX(5deg)

@keyframes showoffY
    0%
        transform: rotateY(-5deg)
    100%
        transform: rotateY(5deg)
</style>

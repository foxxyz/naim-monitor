<template>
    <router-view />
    <span class="version">v{{ version }}</span>
</template>

<script setup>
// Displays version set in package.json
const version = __APP_VERSION__
</script>

<style lang="sass">
@import url('https://fonts.googleapis.com/css2?family=Questrial&family=Roboto:wght@100;300;400;500;700;900&display=swap')

// Reset default styles
*
    margin: 0
    padding: 0
    box-sizing: border-box

// Set default color/background/font-size on root
body
    background: #40e0d0
    color: #000
    font-size: 3vmin
    font-family: Roboto

// Use up at least available space
html, body
    height: 100%

// Reset input styles
input
    font-size: inherit
    font-family: inherit

.version
    position: absolute
    bottom: 0
    right: 0
    padding: .5em
    font-size: .7em

@font-face
    font-family: "Icons",
    font-weight: 900
    src: url(./fonts/icons.woff2) format("woff2")
</style>

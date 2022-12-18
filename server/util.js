function formatTime(duration) {
    const minutes = Math.floor(duration / 60000)
    const ms = duration % 60000
    const seconds = Math.floor(ms / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

module.exports = {
    formatTime
}
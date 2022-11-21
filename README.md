Naim Monitor
============

Display live information of audio currently playing on Naim devices (Mu-So, Mu-So QB).

![Interface Example 1](https://github.com/foxxyz/naim-monitor/blob/main/docs/example-1.jpg?raw=true)
![Interface Example 2](https://github.com/foxxyz/naim-monitor/blob/main/docs/example-2.jpg?raw=true)
![Interface Example 3](https://github.com/foxxyz/naim-monitor/blob/main/docs/example-3.jpg?raw=true)
![Interface Example 3](https://github.com/foxxyz/naim-monitor/blob/main/docs/example-4.jpg?raw=true)

Requirements
------------

 * Node 18+ (uses native `fetch`)

Installation
------------

### Server

1. Install dependencies: `npm install`
2. Run: `./index.js --naim-host <speaker_ip>`

### GUI

1. Install dependencies: `npm install`
2. Test it works: `npm run dev`

Deployment
----------

### GUI

1. Compile: `npm run build`
2. Upload contents of `dist` to a directory accessible by your web server.

License
-------

MIT

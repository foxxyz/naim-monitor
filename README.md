Naim Monitor
============

Display live information of audio currently playing on Naim Mu-So devices.

![Interface Example 1](https://github.com/foxxyz/naim-monitor/blob/main/docs/example-1.jpg?raw=true)
![Interface Example 2](https://github.com/foxxyz/naim-monitor/blob/main/docs/example-2.jpg?raw=true)
![Interface Example 3](https://github.com/foxxyz/naim-monitor/blob/main/docs/example-3.jpg?raw=true)
![Interface Example 3](https://github.com/foxxyz/naim-monitor/blob/main/docs/example-4.jpg?raw=true)

Supported Naim speakers:

 * Mu-So (1st Generation) 
 * Mu-So QB (1st Generation)

_Note: This is an unofficial library and not supported or endorsed by Naim Audio Ltd_

Requirements
------------

 * Node 18+ (uses native `fetch`)

Installation
------------

### Server

1. Install dependencies: `npm install`
2. Run: `./index.js` (or target a specific speaker with `./index.js --naim-host <ip_or_host>`)

### GUI

1. Install dependencies: `npm install`
2. Test it works: `npm run dev`

Deployment
----------

The included deploy script in `/deploy/deploy.sh` can automate deployment of steps 1/2 below:

```
./deploy/deploy.sh -t <machine_ip>
```

### GUI

1. Compile: `npm run build`
2. Upload contents of `dist` to a directory accessible by your web server (recommended: `/opt/naim-monitor/gui/dist`).
3. (For nginx users) Symlink nginx config: `ln -s /opt/naim-monitor/gui/deploy/nginx.conf /etc/nginx/sites-enabled/naim-monitor.conf`
4. (For nginx users) Reload nginx: `systemctl reload nginx`

### Server

1. Copy or rsync server files to your server of choice (recommended path: `/opt/naim-monitor/server`)

#### Systemd Setup

A systemd service is included for automatic execution and monitoring.

1. Enable service: `systemctl enable /opt/naim-monitor/server/deploy/naim-monitor.service`
2. Start service: `systemctl start naim-monitor`

In case of issues, check the logs with `journalctl -u naim-monitor`

License
-------

MIT

const adb = require('adbkit');
const fs = require('fs');
const request = require('request');
const progress = require('request-progress');
const Readable = require('stream').Readable;
const SetPropertiesCommand = require('./setproperties');

module.exports = class ADB {
    setupAdb(adbPath) {
        if (this.client) return;
        this.client = adb.createClient({
            bin: adbPath,
        });
    }
    installRemote(serial, path, cb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client
            .installRemote(serial, path)
            .then(cb)
            .catch(e => ecb(e));
    }
    install(serial, path, isLocal, cb, scb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client
            .install(
                serial,
                isLocal
                    ? fs.createReadStream(path)
                    : new Readable().wrap(
                          progress(request(path), { throttle: 60 })
                              .on('progress', state => {
                                  scb(state);
                              })
                              .on('end', () => {
                                  scb({ percent: 1 });
                              })
                      )
            )
            .then(cb)
            .catch(e => ecb(e));
    }
    uninstall(serial, packageName, cb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client
            .uninstall(serial, packageName)
            .then(cb)
            .catch(e => ecb(e));
    }
    clear(serial, packageName, cb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client
            .clear(serial, packageName)
            .then(cb)
            .catch(e => ecb(e));
    }
    disconnect(cb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client
            .disconnect()
            .then(cb)
            .then(() => this.client.kill())
            .catch(e => ecb(e));
    }
    connect(deviceIp, cb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client
            .connect(deviceIp + ':5555')
            .then(cb)
            .catch(e => ecb(e));
    }
    tcpip(serial, cb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client
            .tcpip(serial, 5555)
            .then(r => {
                console.log(r);
                cb(r);
            })
            .catch(e => {
                console.log(serial, e);
                ecb(e);
            });
    }
    usb(serial, cb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client
            .usb(serial)
            .then(cb)
            .catch(e => ecb(e));
    }
    listDevices(cb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client
            .listDevices()
            .then(cb)
            .catch(e => ecb(e));
    }
    setProperties(serial, command, cb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client
            .transport(serial)
            .then(function(transport) {
                return new SetPropertiesCommand(transport).execute(command);
            })
            // this.client
            //     .setProperties(serial, command)
            .then(res => cb(res))
            .catch(e => ecb(e));
    }
    getPackages(serial, cb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client
            .getPackages(serial)
            .then(res => cb(res))
            .catch(e => ecb(e));
    }
    shell(serial, command, cb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client
            .shell(serial, command)
            .then(adb.util.readAll)
            .then(res => cb(res.toString()))
            .catch(e => ecb(e));
    }
    readdir(serial, path, cb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client
            .readdir(serial, path)
            .then(res =>
                res.map(r => {
                    r.__isFile = r.isFile();
                    return r;
                })
            )
            .then(res => cb(res))
            .catch(e => ecb(e));
    }
    push(serial, path, savePath, cb, scb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client.push(serial, fs.createReadStream(path), savePath).then(transfer => {
            let _stats, autocancel;
            const interval = setInterval(() => {
                scb(_stats);
            }, 1000);
            transfer.on('progress', stats => {
                clearTimeout(autocancel);
                _stats = stats;
                autocancel = setTimeout(() => {
                    clearInterval(interval);
                    cb();
                }, 40000);
            });
            transfer.on('end', () => {
                clearTimeout(autocancel);
                clearInterval(interval);
                cb();
            });
            transfer.on('error', e => {
                ecb(e);
            });
        });
    }
    pull(serial, path, savePath, cb, scb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client.pull(serial, path).then(transfer => {
            transfer.on('progress', stats => {
                scb(stats);
            });
            transfer.on('end', () => {
                cb();
            });
            transfer.on('error', e => {
                ecb(e);
            });
            transfer.pipe(fs.createWriteStream(savePath));
        });
    }
    stat(serial, path, cb, ecb) {
        if (!this.client) return ecb('Not connected.');
        this.client
            .stat(serial, path)
            .then(res => cb(res))
            .catch(e => ecb(e));
    }
};

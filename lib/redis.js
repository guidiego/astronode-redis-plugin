const redis = require('redis');
const METHOD_OPTS = ['defaultExpirationTime'];

class RedisAdapter {
    constructor(config) {
        this.methodOpts = {};
        this.serverOpts = {};
        this.client = null;

        Object.keys(config).forEach(key => {
            if (~METHOD_OPTS.indexOf(key)) {
                return this.methodOpts[key] = config[key];
            }

            this.serverOpts[key] = config[key];
        });
    }

    autoinitialize() {
        this.client = redis.createClient(this.serverOpts);
    }

    set(key, value, time, cb) {
        return new Promise((resolve, reject) => {
            time = time || this.methodOpts.defaultExpirationTime || null;
            const opt = time ? 'EX' : null;

            this.client.set(key, value, opt, time, err => {
                if (err) reject(err);
                return resolve();
            });
        });
    }

    get(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, data) => {
                if (err) reject(err);
                return resolve(data);
            });
        });
    }
}

module.exports = RedisAdapter;
const redis = require('redis');
const RedisAdapter = require('./redis');

describe('Redis Adapter', () => {
    let fakeOpts = { port: 2 };
    let expectedGetCb;
    let expectedSetCb;
    let getErr;
    let setErr;
    const getReturn = 'FAKE_GET';
    const fakeKey = 'FAKE_KEY';
    const fakeValue = 'FAKE_VALUE';
    const makeRedis = () => {
        const adapter = new RedisAdapter(fakeOpts);
        adapter.autoinitialize();
        return adapter;
    }
    const fakeClient = {
        get: jest.fn(),
        set: jest.fn(),
    };

    redis.createClient = jest.fn().mockReturnValue(fakeClient);

    beforeEach(() => {
        fakeClient.set.mockImplementation((key, value, opts, time, cb) => {
            expectedSetCb = cb;
            cb(setErr)
        });

        fakeClient.get.mockImplementation((key, cb) => {
            expectedGetCb = cb;
            cb(getErr, getReturn)
        });
    });

    afterEach(() => {
        expectedGetCb = null;
        expectedSetCb = null;
        getErr = null;
        setErr = null;
        fakeOpts = {}
        jest.clearAllMocks();
    });

    it('shoudl start redis', () => {
        const port = 2000;
        const defaultExpirationTime = 100;
        const adapter = new RedisAdapter({ port, defaultExpirationTime });

        adapter.autoinitialize();
        expect(redis.createClient).toHaveBeenCalledWith({ port });
        expect(adapter.methodOpts).toHaveProperty('defaultExpirationTime', defaultExpirationTime);
    });

    it('should reject redis get', () => {
        getErr = 'FAKE_GET_ERR'
        return makeRedis().get(fakeKey).catch(err => {
            expect(err).toBe(getErr);
        });
    });

    it('should reject redis set', () => {
        setErr = 'FAKE_SET_ERR'
        return makeRedis().set(fakeKey, fakeValue).catch(err => {
            expect(err).toBe(setErr);
        });
    });

    it('should exec redis get', () => {
        return makeRedis().get(fakeKey).then(data => {
            expect(data).toBe(getReturn);
            expect(fakeClient.get).toHaveBeenCalledWith(fakeKey, expectedGetCb);
        });
    });

    it('should redis set without timeout and defaultExpirationTime', () => {
        return makeRedis().set(fakeKey, fakeValue).then(data => {
            expect(data).toBe(undefined);
            expect(fakeClient.set).toHaveBeenCalledWith(fakeKey, fakeValue, null, null, expectedSetCb);
        });
    });

    it('should redis set without timeout but with defaultExpirationTime', () => {
        const defaultExpirationTime = 100;
        fakeOpts.defaultExpirationTime = defaultExpirationTime;

        return makeRedis().set(fakeKey, fakeValue).then(data => {
            expect(data).toBe(undefined);
            expect(fakeClient.set).toHaveBeenCalledWith(fakeKey, fakeValue, 'EX', defaultExpirationTime, expectedSetCb);
        });
    });

    it('should redis set with timeout overriding defaultExpirationTime', () => {
        const defaultExpirationTime = 100;
        const overridingDefaultValue = 200;
        fakeOpts.defaultExpirationTime = defaultExpirationTime;

        return makeRedis().set(fakeKey, fakeValue, overridingDefaultValue).then(data => {
            expect(data).toBe(undefined);
            expect(fakeClient.set).toHaveBeenCalledWith(fakeKey, fakeValue, 'EX', overridingDefaultValue, expectedSetCb);
        });
    });

    it('should redis set with timeout without defaultExpirationTime', () => {
        const time = 200;

        return makeRedis().set(fakeKey, fakeValue, time).then(data => {
            expect(data).toBe(undefined);
            expect(fakeClient.set).toHaveBeenCalledWith(fakeKey, fakeValue, 'EX', time, expectedSetCb);
        });
    });
});
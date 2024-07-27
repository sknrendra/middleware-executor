const MiddlewareStack = require('../src/main')

describe('Middleware stack', () => {
    it('can run single middleware', () => {
        let app = new MiddlewareStack()
    
        let result = ''
        let req = {url: '/'}
        let res = {
            writeHead(status, header) {},
            end(val) {
                result = val
            }
        }
        app.use((req, res, next) => {
            res.writeHead(200, {message: 'Success'})
            res.end('Hello World')
        })
        app.execute(req, res)
        expect(result).toBe('Hello World');
    });
    it('can run multiple middlewares', async () => {
        let app = new MiddlewareStack()
    
        let result = []
        let req = {url: '/'}
        let res = {
            writeHead(status, header) {},
            end(val) {
                result.push(val)
            }
        }
        app.use((req, res, next) => {
            res.writeHead(200, {message: 'Success'})
            res.end('Hello World')
            next()
        })
        app.use((req, res, next) => {
            res.writeHead(200, {message: 'Success'})
            res.end('Hello World2')
            next()
        })
        app.execute(req, res)
        expect(result).toEqual(['Hello World', 'Hello World2'])
    });
    it('can run multiple middlewares in expected order', async () => {
        let app = new MiddlewareStack()
    
        let result = []
        let req = {url: '/'}
        let res = {
            writeHead(status, header) {},
            end(val) {
                result.push(val)
            }
        }
        app.use((req, res, next) => {
            res.writeHead(200, {message: 'Success'})
            res.end('Hello World')
            next()
            res.end('Hello World')
        })
        app.use((req, res, next) => {
            res.writeHead(200, {message: 'Success'})
            res.end('Hello World2')
            next()
            res.end('Hello World2')
        })
        app.execute(req, res)
        expect(result).toEqual(['Hello World', 'Hello World2', 'Hello World2', 'Hello World'])
    });
    it('can handle multiple execute() calls with different requests', async () => {
        let app = new MiddlewareStack()
    
        let result = []
        let req = [
            {url: '/first-test', responseContainer: ''},
            {url: '/second-test', responseContainer: ''}
        ]
        let res = {
            writeHead(status, header) {},
            end(val) {
                result.push(val)
            }
        }
        app.use((req, res, next) => {
            res.writeHead(200, {message: 'Success'})
            res.end(`You requested ${req.url}`)
            next()
        })
        app.execute(req[0], res)
        app.execute(req[1], res)
        expect(result).toEqual(['You requested /first-test', 'You requested /second-test'])
    });
    it('does not accept more middlewares once execute() is called', async () => {
        let app = new MiddlewareStack()
    
        let result = []
        let req = [
            {url: '/first-test', responseContainer: ''},
            {url: '/second-test', responseContainer: ''},
        ]
        let res = {
            writeHead(status, header) {},
            end(val) {
                result.push(val)
            }
        }
        app.use((req, res, next) => {
            res.writeHead(200, {message: 'Success'})
            res.end(`You requested ${req.url}`)
            next()
        })
        app.execute(req[0], res)
        app.use((req, res, next) => {
            res.writeHead(200, {message: 'Success'})
            res.end(`Second middleware. You requested ${req.url}`)
            next()
        })
        app.execute(req[1], res)
        expect(result).toEqual(['You requested /first-test', 'You requested /second-test'])
    });
    it('responds with error if it happens to user', async () => {
        let app = new MiddlewareStack()
    
        let result = ''
        let req = {url: '/first-test',}
        let res = {
            writeHead(status, header) {},
            end(val) {
                result = val
            }
        }
        app.use((req, res, next) => {
            throw new Error('error encountered')
            next()
        })
        await app.execute(req, res)
        console.log('executing test..', result)
        expect(result).toEqual('error encountered')
    });
})
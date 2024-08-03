const http = require('http')
const MiddlewareStack = require('../src/main')

// untested: if middleware skip routes

describe('Routing', () => {
    it('should execute matching http method', async () => {
        let app = new MiddlewareStack()

        http.METHODS.forEach(method => {
            const lowercaseMethod = method.toLowerCase();
            app[lowercaseMethod]('/test', (req, res) => {
                res.writeHead(200, {'Content-Type': 'text/plain'})
                res.end(`matched with ${lowercaseMethod}`)
            })
        });

        let result = []
        http.METHODS.forEach(method => {
            const lowercaseMethod = method.toLowerCase();
            let req = {url: '/test', method: lowercaseMethod}
            let res = {
                writeHead(status, header) {},
                end(val) {
                    result.push(val)
                }
            }
            app.execute(req, res)
        });

        let expectedResult = []
        http.METHODS.forEach(method => {
            const lowercaseMethod = method.toLowerCase();
            expectedResult.push(`matched with ${lowercaseMethod}`)
        });
        expect(result).toEqual(expectedResult)
    })
    it('should not execute nonmatching http method', async () => {
        let app = new MiddlewareStack()
        app.get('/', (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/plain'})
            res.end('should not have happened')
        })

        let result = []
        let req = {url: '/test', method: 'get'}
        let res = {
            writeHead(status, header) {},
            end(val) {
                result.push(val)
            }
        }
        await app.execute(req, res)
        expect(result).toEqual([`path ${req.url} not found`])
    })
    it('should execute matching route', async () => {
        let app = new MiddlewareStack()
        app.use('/test', (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/plain'})
            res.end('should be accepted')
            res.headersSent = true
        })

        let result = []
        let req = {url: '/test', method: 'get'}
        let res = {
            writeHead(status, header) {},
            end(val) {
                result.push(val)
            }
        }
        await app.execute(req, res)
        expect(result).toEqual([`should be accepted`])
    })
    it('should not execute nonmatching route', async () => {
        let app = new MiddlewareStack()
        app.use('/', (req, res, next) => {
            res.writeHead(200, {'Content-Type': 'text/plain'})
            res.end('should not have happened')
            res.headersSent
            next()
        })

        let result = []
        let req = {url: '/test', method: 'get'}
        let res = {
            writeHead(status, header) {},
            end(val) {
                result.push(val)
            }
        }
        await app.execute(req, res)
        expect(result).toEqual([`path ${req.url} not found`])
    })

    it('should skip route if specified', async () => {
        let app = new MiddlewareStack()
        app.use('/test', (req, res, next) => {
            next('route')
            res.writeHead(200, {'Content-Type': 'text/plain'})
            res.end('should not have happened')
            res.headersSent
        })

        let result = []
        let req = {url: '/test', method: 'get'}
        let res = {
            writeHead(status, header) {},
            end(val) {
                result.push(val)
            }
        }
        await app.execute(req, res)
        expect(result).toEqual([`path ${req.url} not found`])
    })

    it('returns 404 response if no route matches the request URL', async () => {
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
            next()
        })
        await app.execute(req, res)
        expect(result).toEqual(`path ${req.url} not found`)
    });
})
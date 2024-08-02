const http = require('http')
// PASS if middleware skip routes
// enhance: wrap this.res and this.req in c. this helps with compatibility with other web servers


module.exports = class MiddlewareStack {
    constructor() {
        this.middlewareStack = []
        this.middlewareCompiled = false //if compiled, we don't accept more middlewares.

        http.METHODS.forEach(method => {
            const lowercaseMethod = method.toLowerCase();
            this[lowercaseMethod] = function(path, handler) {
                this.callHttpMethod(handler, path, lowercaseMethod);
            };
        });
    }

    callHttpMethod(handler, path, method) {
        this.use((req, res, next) => {
            let requestPath = `/${req.url.split('/')[1]}`
            if (requestPath === path && req.method === method) handler(req, res)
            next()
        })
    }

    use(arg, route) {
        if (this.middlewareCompiled) return
        if (arg instanceof Function) this.middlewareStack.push(arg)
        if (typeof arg === 'string' && arguments.length === 2) {
            this.middlewareStack.push((req, res, next) => {
                let path = `/${req.url.split('/')[1]}`
                if (path === arg) route(req, res, next)
            })
        }
    }

    async execute(req, res) {
        this.middlewareCompiled = true
        if (!this.middlewareStack.length) {
            console.warn('[middleware-executor] no middlewares registered, be sure to use app.use() before calling app.execute()')
        }
        await new MiddlewareStackExecutor(req, res, this.middlewareStack)
            .execute()
            .then(() => {
                if (res.headersSent) return
                res.writeHead(404, {'Content-Type': 'text/plain'})
                res.end(`path ${req.url} not found`)
            })
            .catch(err => {
                res.writeHead(500, {'Content-Type': 'text/plain'})
                res.end(err.message || "Internal Server Error")
            })
    }
}

class MiddlewareStackExecutor {

    constructor(req, res, stack) {
        this.middlewareStack = stack
        this.req = req
        this.res = res
        this.current = 0
    }

    async getNext(arg) {
        if (arg === 'route') return
        if (this.res.headersSent) return
        if (arg instanceof Error) throw err

        this.current++
        if (this.current >= this.middlewareStack.length) return //don't execute if no more middleware in stack
        await this.executeNext() //else keep executing middleware..
    }

    async executeNext() {
        // if promises, defer calling getNext() until it is resolved.
        await this.middlewareStack[this.current](this.req, this.res, this.getNext.bind(this))
    }

    /**
     * the first time execute() is called, in my machine it requires 12-14ms, the next one 0.3-0.6ms
     */
    async execute() {
        if (!this.middlewareStack.length) return
        await this.executeNext()
    }
}
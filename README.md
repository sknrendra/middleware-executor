# middleware-executor

`middleware-executor` allows you to use express.js middlewares on node's builtin http module. It also provides middleware functionality similar to Express, but for Node.js's built-in HTTP module. It allows you to define middleware, route handlers, and create an HTTP server using Node's native methods. Other advantages:

- Lightweight, only 2.91kB
- No dependencies
- Use node.js fast `http` module 

## Installation

```bash
npm install middleware-executor
```

## Usage
To use `middleware-stack`, instantiate it as follows:

```javascript
const MiddlewareStack = require('middleware-executor');
let app = new MiddlewareStack();
```

Add middlewares with `use()`

```javascript
app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  next();
});
```

Add some route handlers:

```javascript
app.get('/hello', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, world!');
});

app.post('/data', (req, res) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });
  req.on('end', () => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: body }));
  });
});
```

Also add routes if you wish. This will route all paths that starts with `/api` to this middleware:

```javascript
app.use('/api', (req, res, next) => {
  console.log('API Request');
  next();
});
```
One difference with express is that we need to pass `execute()` to `createServer()`.
This is like saying, We want to process each request and response with previously defined middlewares.

```javascript
const server = http.createServer(app.execute(req, res));

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
```

so instead of using `app.use()` inside a handler, we call it outside of it. Note that calling `app.use()` after calling `app.execute()` will not have any effect.

## Note
When using the request and response objects, use Node's built-in methods like res.writeHead() and res.end(). We have not yet implemented middleware to "enrich" the res object with methods such as res.json() or res.sendFile().

`app.execute()` will only run code that are registered as a middleware inside `middleware-executor`. This does mean that everything should be run as a middleware, even if it's just a single `console.log()` command
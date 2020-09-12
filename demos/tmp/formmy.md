```js
// Parse headers and setup the parser, ready to start listening for data.
this.writeHeaders(req.headers);

// Start listening for data.
var self = this;
req
    .on('error', function(err) {
        self._error(err);
    })
    .on('aborted', function() {
        self.emit('aborted');
        self._error(new Error('Request aborted'));
    })
    .on('data', function(buffer) {
        self.write(buffer);
    })
    .on('end', function() {
        if (self.error) {
            return;
        }

        var err = self._parser.end();
        if (err) {
            self._error(err);
        }
    });
```
# lx-mongodb [![Build Status](https://travis-ci.org/litixsoft/lx-mongodb.png?branch=master)](https://travis-ci.org/litixsoft/lx-mongodb)

Litixsoft backend driver for mongoDb based on mongojs.

## Install:

```javascript
npm install lx-mongodb
```

## Documentation
[http://www.litixsoft.de/products-lxmongodb](http://www.litixsoft.de/products-lxmongodb) (german)

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](http://gruntjs.com/).

## Release History

### v0.3.3
* gridFs implemented with mongojs

### v0.3.2
* fix error in function create(), now also arrays can be passed as doc

### v0.3.1
* fix error in function convertToMongoId(), $in array with mongoId's was not identified correctly

### v0.3.0
* update lx-helpers
* refactor to take advantage of the new type checking in lxHelpers
* refactor sort option, it can be now a string, array or object

### v0.2.6
* refactor some param checks to callback with an TypeError instead of throwing an exception

### v0.2.5
* refactor baseRepo.delete()
* update tests
* change deprecated mongo option {safe: true} to {w: 1}

### v0.2.4
* callback with TypeError in getById() when id is null or undefined

### v0.2.3
* change some Errors to TypeErrors
* callback with TypeError in getById() when id is of wrong type

### v0.0.1 project initial

## Roadmap

### v0.1.0 first stable version

## Author
[Litixsoft GmbH](http://www.litixsoft.de)

## License
Copyright (C) 2013 Litixsoft GmbH <info@litixsoft.de>
Licensed under the MIT license.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
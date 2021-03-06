@agen/utils
===========

This package contains utility methods to work with async generators.
List of methods:
* `batch` - transforms sequence of items to arrays of the specified size
* `chunks` - transforms sequence of items to series of async generators using
  provided "begin" and "end" methods defining start and end of each chunk
* `combine` - combine all values provided by multiple async generators and
  yields arrays of results
* `decoder` - decodes buffers to string
* `encoder` - transforms sequence of strings to corresponding binary representation
* `filter` - removes some values from the parent iterator
* `fixedSize` - transforms a sequence of arrays of different sizes to arrays
  of the same size
* `getIterator` - returns an iterator for objects implementing iterable protocol
* `iterate` - creates a new iterator and allows to "push" values to it;
   manages backpressure and synchronization between data providers and consumers
* `lines` - transforms sequence of strings (containing '\r' and '\n' symbols) to
   a sequence of individual lines
* `map` - transforms items from the parent async generator to new values
* `multiplexer` - allows to create multiple iterator from one source of values
* `range` - returns a new iteratator providing values from a specified range
  (ex: returns elements with the index in range [3..10]).
* `withIterators` - accepts a list of iterable objects and executes operations
  on the corresponding iterators
* `series` - splits sequence of items to sequence of async generators using
  a specified method defining the end of the previous serie.

Example:
```javascript
const utils = require('@agen/utils');
OR:
import { * as utils } from '@agen/utils';
```

`batch`
-------

This method transforms a sequence of individual items to "batches" (arrays)
of the specified size.
This method accepts the following parameters:
* generator - asynchronous generator providing inidvidual elements
* batchSize - size of returned batches; default value is 10

It returns an asynchronous generator providing element batches (arrays)  
of the specified size.

See also the `fixedSize` method. The `batch` method groups individual items in
arrays while `fixedSize` accepts arrays of diffent sizes and align them
to the specified sizes.

Example:
```javascript

const batch = require('@agen/batch');

...
const list = [
  'item-0',
  'item-1',
  'item-2',
  'item-3',
  'item-4',
  'item-5',
  'item-6',
  'item-7'
]
for await (let b of batch(list, 3)) {
  console.log('-', b);
}
// Will print
// - ['item-0', 'item-1', 'item-2']
// - ['item-3', 'item-4', 'item-5']
// - ['item-6', 'item-7']
```

`chunks` method
---------------

This method accepts the following parameters:
* generator - asynchronous generator providing inidvidual elements
* begin - a function returning `true` when a new chunk starts
* end - a function returning `true` when the current chunk should be finished

It returns an asynchronous generator providing new async generators giving
access to a subset of elements from the initial sequence.


Example:
```javascript

const { chunk } = require('@agen/utils');

...
const list = [
  'item-0',
  'item-1',
  'item-2',
  'item-3',
  'item-4',
  'item-5',
  'item-6',
  'item-7'
]
const begin = (v, i) => i % 2 === 0;
const end = (v, i) => i % 5 === 0;
for await (let chunk of chunks(list, begin, end)) {
  // Each chunk is an async generator giving access to sub-set of items
  console.log('---------------');
  for await (let item of chunk) {
    console.log('*', item);
  }
}
// Will print:
// ---------------
// * item-0
// * item-1
// * item-2
// * item-3
// * item-4
// * item-5
// ---------------
// * item-6
// * item-7
```

`combine` method
----------------

Combine all values provided by given generators and yields arrays of this values
in all combinations.

This method accepts a list of async generators and  returns an asynchronous
generator yielding arrays of values.

Example:
```javascript

const { combine } = require('@agen/utils');
(async () => {
  const gen = combine(
    ['A', 'B', 'C'],
    [1, 2, 3, 4, 5]
  );
  for await (let array of gen) {
    console.log(array);
  }  
})();
// Will print:
// [ 'A', undefined ]
// [ 'A', 1 ]
// [ 'B', 1 ]
// [ 'B', 2 ]
// [ 'C', 2 ]
// [ 'C', 3 ]
// [ 'C', 4 ]
// [ 'C', 5 ]
```

`decoder`
---------
This method decodes buffer to string. It accept sequence of buffers and returns
the corresponding decoded strings. Internally it uses standard TextDecoder
class. It accepts two parameters:
* generator - async generator providing binary arrays (buffers)
* enc - optional encoding for strings in binaries

Example: transforming binary arrays to strings
```javascript
const { decoder } = require('@agen/utils');
const list = [
  Uint8Array.from([ 70, 105, 114, 115, 116, 32,  77, 101, 115, 115, 97, 103, 101 ]),
  Uint8Array.from([ 72, 101, 108, 108, 111,  32, 119, 111, 114, 108, 100 ]),
  Uint8Array.from([ 83, 101,  99, 111, 110, 100,  32,  77, 101, 115, 115,  97, 103, 101 ]),
  Uint8Array.from([ 72, 101, 108, 108, 111, 32,  74, 111, 104, 110, 32,  83, 109, 105, 116, 104 ])
]
for await (let item of decoder(list, 'UTF-8')) {
  console.log('-', item);
}
// Will print
// - First Message
// - Hello world
// - Second Message
// - Hello John Smith
```

`encoder`
---------
This method transforms sequence of strings to corresponding binary string
representation. Strings are always encoded with UTF-8.
It accepts one parameters:
* generator - async generator providing strings to encode
The returned generator yields binary string representation.

Example: strings to binary arrays
```javascript
const { encoder } = require('@agen/utils');
const list = [
  'First Message',
  'Hello world',
  'Second Message',
  'Hello John Smith'
]
for await (let buf of encoder(list)) {
  console.log('-', buf);
}
// Will print
// - Uint8Array [
//   70, 105, 114, 115, 116,
//   32,  77, 101, 115, 115,
//   97, 103, 101
// ]
// - Uint8Array [
//    72, 101, 108, 108,
//   111,  32, 119, 111,
//   114, 108, 100
// ]
// - Uint8Array [
//    83, 101,  99, 111, 110,
//   100,  32,  77, 101, 115,
//   115,  97, 103, 101
// ]
// - Uint8Array [
//    72, 101, 108, 108, 111,
//    32,  74, 111, 104, 110,
//    32,  83, 109, 105, 116,
//   104
// ]
```

`filter` method
---------------

Filters (removes) individual items from parent async generator.

This method accepts the following parameters:
* generator - asynchronous generator providing inidvidual elements
* filter - method checking individual elements; if this method returns true then
  this element appears in the resulting sequence; Filters gets two parameters:
  - item to check
  - current item index

It returns an asynchronous generator providing accepted elements.


Example 1: filtering by the element value
```javascript
const { filter } = require('@agen/utils');
// OR: import { filter } from '@agen/utils';
...
const list = [
  'First Message',
  'Hello world',
  'Second Message',
  'Hello John Smith'
]
for await (let item of filter(list, (v, i) => v.indexOf('Hello') >= 0)) {
  console.log('-', item);
}
// Will print
// - Hello world
// - Hello John Smith
```

Example 2: filtering by the element index
```javascript
const { filter } = require('@agen/utils');
...
const list = [
  'item-0',
  'item-1',
  'item-2',
  'item-3',
  'item-4',
  'item-5',
  'item-6',
  'item-7'
]
for await (let item of filter(list, (v, i) => i % 2 === 0)) {
  console.log('-', item);
}
// Will print
// - item-0
// - item-2
// - item-4
// - item-6
```

`iterator`
----------

Returns a new AsyncGeneratorFunction which is feeded by the specified initializer
pushing values to the iterator.

Features:
- don't "swallow" provided data
- synchronizes data providers and consumers; useful too manage "backpressures"
- always notifies providers about the end of the iteration

This method accepts the following parameters:
* init - a function accepting an object with the `next`, `complete` and `error`
  methods and returning an optional cleanup method.

Structure of the object accepted by the initialization function:
  - `async next(value)` - provides values for the iterator
  - `async complete()` - notifies about the end of iterations
  - `async error(error)` - notifies about an error generated by the data provider
Returns an AsyncGeneratorFunction instance.

  Example:

  ```javascript
  const { iterateor } = require('@agen/utils');

  const newIterator = iterator((o) => {
    // This flag is used to interrupt the data provider
    let stop = false;
    (async () => {
      try {
        for (let i = 0; !stop && i < 1000; i++) {
          // Notifies about a new value  
          // and wait until this object is consumed.
          await o.next({ message : `Hello - ${i}` });
        }
        // Notifies about the end of iterations.
        await o.complete();

      } catch (err) {
        // Notifies about an error generated by the provider.
        await o.error(err);
      }
    })();
    // This optional returned function is called when iterations are interrupted.
    return async () => {
      stop = true;
      console.log('STOP ITERATIONS');
    }
  })
  let counter = 0;
  const it = newIterator();
  for await (let item of it) {
   console.log('-', item);
   counter++;
   if (counter === 3) break;
  }
  // Will print
  // - { message : "Hello - 0" }
  // - { message : "Hello - 1" }
  // - { message : "Hello - 2" }
  // - STOP ITERATIONS
  ```

`iterate`
---------
Note 1: See `iterator`.
Note 2: This method creates an AsyncGeneratorFunction with the `iterator`
        function and calls it immediately. 

Creates a new iterator and allows to "push" values to it.
Features:
- don't "swallow" provided data
- synchronizes data providers and consumers; useful too manage "backpressures"
- always notifies providers about the end of the iteration

This method accepts the following parameters:
* init - a function accepting an object with the `next`, `complete` and `error`
  methods and returning an optional cleanup method.

Structure of the object accepted by the initialization function:
  - `async next(value)` - provides values for the iterator
  - `async complete()` - notifies about the end of iterations
  - `async error(error)` - notifies about an error generated by the data provider

  Example:

  ```javascript
  const { iterate } = require('@agen/utils');

  const it = iterate((o) => {
    // This flag is used to interrupt the data provider
    let stop = false;
    (async () => {
      try {
        for (let i = 0; !stop && i < 1000; i++) {
          // Notifies about a new value  
          // and wait until this object is consumed.
          await o.next({ message : `Hello - ${i}` });
        }
        // Notifies about the end of iterations.
        await o.complete();

      } catch (err) {
        // Notifies about an error generated by the provider.
        await o.error(err);
      }
    })();
    // This optional returned function is called when iterations are interrupted.
    return async () => {
      stop = true;
      console.log('STOP ITERATIONS');
    }
  })
  let counter = 0;
  for await (let item of it) {
   console.log('-', item);
   counter++;
   if (counter === 3) break;
  }
  // Will print
  // - { message : "Hello - 0" }
  // - { message : "Hello - 1" }
  // - { message : "Hello - 2" }
  // - STOP ITERATIONS
  ```

`lines`
-------

Transform sequence of strings to sequence of lines - it splits strings
by '\r' and '\n' symbols and returns individual lines;

This method accepts the following parameters:
* generator - asynchronous generator providing inidvidual strings

It returns an asynchronous generator yielding lines.


Example:

```javascript
const { lines } = require('@agen/utils');
const list = [
  'first line\nsecond ',
  'line\nthird line\nfou',
  'rth li',
  'ne\nfifth line',
]
for await (let line of lines(list)) {
 console.log('-', line);
}
// Will print
// - first line
// - second line
// - third line
// - fourth line
// - fifth line
```

`fixedSize`
-----------

This method transforms a sequence of arrays of different sizes to arrays of the
same size.
This method accepts the following parameters:
* generator - asynchronous generator providing inidvidual elements
* Type - type of the returned arrays
* size - size of returned arrays

It returns an asynchronous generator providing element batches (arrays)  
of the fixed size.

See also the `batch` method. The `batch` method groups individual items in
arrays while `fixedSize` accepts arrays of diffent sizes and align them
to the specified sizes.

Example:
```javascript

const { fixedSize } = require('@agen/utils');
const list = ['hello', 'world'];
const chunkLen = 3;
for await (let chunk of fixedSize(list, Array, chunkLen)) {
  console.log('* ', chunk)
}
// Will print
// *  [ 'h', 'e', 'l' ]
// *  [ 'l', 'o', 'w' ]
// *  [ 'o', 'r', 'l' ]
// *  [ 'd' ]
```

`map` method
------------

Transform items from the parent async generator to new values.

This method accepts the following parameters:
* generator - asynchronous generator providing inidvidual items
* map - method transforming the initial item

It returns an asynchronous generator providing transformed items.


Example:

```javascript
const { map } = require('@agen/utils');
...
 const list = [ 'a', 'b', 'c' ]
 for await (let item of map(list, (v, i) => v.toUpperCase())) {
   console.log('-', item);
 }
// Will print
// - A
// - B
// - C
```

`multiplexer` method
--------------------

Dispatch all values to multipe iterators.

This method accepts the following parameters:
* init - a function accepting an object with the `next`, `complete` and `error`
  methods and returning an optional cleanup method.

Structure of the object accepted by the initialization function:
  - `async next(value)` - provides values for the iterator
  - `async complete()` - notifies about the end of iterations
  - `async error(error)` - notifies about an error generated by the data provider

It returns an AsyncGeneratorFunction instance which can be called multiple times 
to create new iterators over provided values.


Example:

```javascript
const { multiplexer } = require('@agen/utils');

// Step 1: Create a newIterator method generating iterators:
let observer;
const newIterator = multiplexer(o => observer = o);

// Step 2: Create 3 iterators printing values on the screen
for (let n = 0; n < 3; n++) {
  (async (id) => {
    for await (let item of newIterator()) {
      console.log('- ', id, item);
    }
  })(n);
}

// Step 3: Use the observer to generate new values for iterators 
let count = 100;
for (let i = 0; i < count; i++) {
  console.log('--------------');
  // Send a new value to all iterators  
  // and wait until this object is consumed.
  await observer.next({ message : `Hello - ${i}` });
}
// Notifies about the end of iterations.
await observer.complete();

// Will print
// -  0 { message: 'Hello - 0' }
// -  1 { message: 'Hello - 0' }
// -  2 { message: 'Hello - 0' }
// --------------
// -  0 { message: 'Hello - 1' }
// -  1 { message: 'Hello - 1' }
// -  2 { message: 'Hello - 1' }
// --------------
// -  0 { message: 'Hello - 2' }
// -  1 { message: 'Hello - 2' }
// -  2 { message: 'Hello - 2' }
// --------------
// -  0 { message: 'Hello - 3' }
// ...
  ```



Example:

```javascript
const { map } = require('@agen/utils');
...
 const list = [ 'a', 'b', 'c' ]
 for await (let item of map(list, (v, i) => v.toUpperCase())) {
   console.log('-', item);
 }
// Will print
// - A
// - B
// - C
```


`range` method
--------------

The `range` method returns specified range of items from the parent async generator.

This method accepts the following parameters:
* generator - asynchronous generator providing items
* min - minimal index of the returned elements; 0 by default
* max - maximal index of returned items; Inifinity by default

It returns an asynchronous generator providing items from the specified range.

Example:
```javascript

const { range } = require('@agen/utils');
// OR: import { range } from '@agen/utils';
...
const list = [ 'a', 'b', 'c', 'd', 'e', 'f' ]
for await (let item of range(list, 1, 3) {
  console.log('-', item);
}
// Will print
// - b
// - c
// - d

```

`slicer`
--------

This method returns a new function providing async iterators over the specified
byte range of the data.

Parameters:
* `provider` - async generator providing data blocks
* `slice` - function returning a new block of the given length with the range
  of bytes starting from the specified buffer offset  
* `length` - function providing the length of the given buffer; default
  implementation checks the "byteLength" or "length" properties


Example:

```javascript
const { slicer } = require('@agen/utils');
// List of blocks. It can be an async generator as well.
const list = ['a', 'b', 'c', 'd', 'e', 'f']
const f = slicer(list);
let result = [];
for await (let s of f(3)) {
  result.push(s);
}
// Will print the first 3 bytes: ['a', 'b', 'c']
console.log('-', result);

result = [];
for await (let s of f(2)) {
  result.push(s);
}
// Will print next 2 bytes: ['d', 'e']
console.log('-', result);

```

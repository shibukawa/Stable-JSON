Stable JSON
===========

**Stable JSON** is a derived version of `JSON 3 <http://bestiejs.github.com/json3/>`_ JSON implementation.
99.9% of this source code is based on Kit Cambridge's code. Thank you Kit Cambridge.

JSON is a common deta exchange format and many languages support it. This implementation guarantees the order of object entries.
It is good for storing JSON to version control systems, like SVN, Mercurial, git, bzr and so on.

API is almost compatible with ECMAScript specification. It provides following functions:

* ``SJSON.stringify``

  It is slmost as same as `JSON.stringify <https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/JSON/stringify>`_.
  But third parameter is not supported. This method assumes it is always 4 spaces.

* ``SJSON.parse``

  It is 100% compatible with `JSON.parse <https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/JSON/parse>`_.

License
=======

MIT-License::

  Copyright © 2012 Yoshiki Shibukawa

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
  associated documentation files (the “Software”), to deal in the Software without restriction, including
  without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to
  the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial
  portions of the Software.

  THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
  LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

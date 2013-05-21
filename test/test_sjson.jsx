import "test-case.jsx";
import "console.jsx";
import "sjson.jsx";


class _Test extends TestCase
{
    // Ensures that `JSON.parse` throws an exception when parsing the given
    // `source` string.
    function parseError (source : string, message : string) : void {
        try {
            JSON.parse(source);
            this.fail(message);
        }
        catch (exception : Error)
        {
            if (exception.name != "SyntaxError")
            {
                this.fail(message);
            }
        }
    }

    // Ensures that `JSON.parse` parses the given source string correctly.
    function parses (expected : variant, source : string, message : string) : void {
        this.expect(this.equals(SJSON.parse(source), expected), message).toBe(true);
    }

    // Ensures that `SJSON.stringify` serializes the given object correctly.
    function serializes (expected : string , value : variant, message : string, width : int) : void {
        this.expect(SJSON.stringify(value, width), message).toBe(expected);
    }

    function serializes (expected : Nullable.<string>, value : variant, message : string) : void {
        this.expect(SJSON.stringify(value, 4), message).toBe(expected);
    }

    function equal (expected : string, value : string, message : string) : void {
        this.expect(this.equals(expected, value), message).toBe(true);
    }

    // Ensures that `SJSON.stringify` throws a `TypeError` if the given object
    // contains a circular reference.
    function cyclicError (value : variant, message : string) : void {
        try
        {
            SJSON.stringify(value);
            this.fail(message);
        }
        catch (exception : Error)
        {
            if (exception.name != "TypeError")
            {
                this.fail(message);
            }
        }
    }

  // Tests
  // -----

    /* function test_stringify_and_parse () : void {
        this.parses({"a": 1, "b": 16}, '{"a": 1, "b": "10000"}', "Callback function provided", function (key, value) {
            return typeof value == "string" ? parseInt(value, 2) : value;
        });
        this.serializes("{\n    \"bar\": 456\n}", {"foo": 123, "bar": 456}, "Object; optional `filter` and `whitespace` arguments", ["bar"]);
        // Test adapted from the Opera JSON test suite via Ken Snyder.
        // See http://testsuites.opera.com/JSON/correctness/scripts/045.js
        this.serializes('{\n    "PI": 3.141592653589793\n}', Math, "List of non-enumerable property names specified as the `filter` argument", ["PI"]);
        this.equal(3, JSON.parse("[1, 2, 3]", function (key, value) {
        if (typeof value == "object" && value) {
            return value;
        }
        }).length, "Issue #10: `walk` should not use `splice` when removing an array element");
        this.done(4);
    }
  */

    function test_stringify () : void
    {
        var expected = 29, value, pattern;

        // Special values.
        this.serializes("null", null, "`null` is represented literally");
        this.serializes("null", 1 / 0, "`Infinity` is serialized as `null`");
        this.serializes("null", 0 / 0, "`NaN` is serialized as `null`");
        this.serializes("null", -1 / 0, "`-Infinity` is serialized as `null`");
        this.serializes("true", true, "Boolean primitives are represented literally");
        this.serializes("false", new Boolean(false), "Boolean objects are represented literally");
        this.serializes('"\\\\\\"How\\bquickly\\tdaft\\njumping\\fzebras\\rvex\\""', new String('\\"How\bquickly\tdaft\njumping\fzebras\rvex"'), "All control characters in strings are escaped");

        this.serializes("[\n    false,\n    1,\n    \"Kit\"\n]", [new Boolean, new Number(1), new String("Kit")], "Arrays are serialized recursively");
        this.serializes("[\n    null\n]", [null] : variant[], "`[undefined]` is serialized as `[null]`");

        // Property enumeration is implementation-dependent.
        var value = {
            "jdalton": ["John-David", 29],
            "kitcambridge": ["Kit", 18],
            "mathias": ["Mathias", 23]
        } : variant;
        this.parses(value, SJSON.stringify(value), "Objects are serialized recursively");

        // Complex cyclic structures.
        value = { "foo": { "b": { "foo": { "c": { "foo": null} : variant } } } } : variant;
        this.serializes('{\n    "foo": {\n        "b": {\n            "foo": {\n                "c": {\n                    "foo": null\n                }\n            }\n        }\n    }\n}', value, "Nested objects containing identically-named properties should serialize correctly");

        value['foo']['b']['foo']['c']['foo'] = value;
        this.cyclicError(value, "Objects containing complex circular references should throw a `TypeError`");

        // Sparse arrays.
        var avalue = [] : variant[];
        avalue[5] = 1;
        this.serializes("[\n    null,\n    null,\n    null,\n    null,\n    null,\n    1\n]", avalue, "Sparse arrays should serialize correctly");

        // Dates.
        this.serializes('"1994-07-03T00:00:00.000Z"', new Date(Date.UTC(1994, 6, 3)), "Dates should be serialized according to the simplified date time string format");
        this.serializes('"1993-06-02T02:10:28.224Z"', new Date(Date.UTC(1993, 5, 2, 2, 10, 28, 224)), "The date time string should conform to the format outlined in the spec");
        this.serializes('"-271821-04-20T00:00:00.000Z"', new Date(-8.64e15), "The minimum valid date value should serialize correctly");
        this.serializes('"+275760-09-13T00:00:00.000Z"', new Date(8.64e15), "The maximum valid date value should serialize correctly");
        this.serializes('"+010000-01-01T00:00:00.000Z"', new Date(Date.UTC(10000, 0, 1)), "https://bugs.ecmascript.org/show_bug.cgi?id=119");

        // Tests based on research by @Yaffle. See kriskowal/es5-shim#111.
        this.serializes('"1969-12-31T23:59:59.999Z"', new Date(-1), "Millisecond values < 1000 should be serialized correctly");
        this.serializes('"-000001-01-01T00:00:00.000Z"', new Date(-621987552e5), "Years prior to 0 should be serialized as extended years");
        this.serializes('"+010000-01-01T00:00:00.000Z"', new Date(2534023008e5), "Years after 9999 should be serialized as extended years");
        this.serializes('"-109252-01-01T10:37:06.708Z"', new Date(-3509827334573292), "Issue #4: Opera > 9.64 should correctly serialize a date with a year of `-109252`");

        // Opera 7 normalizes dates with invalid time values to represent the
        // current date.
        value = new Date("Kit");
        if (!Number.isFinite(value as number)) {
            expected += 1;
            this.serializes("null", value, "Invalid dates should serialize as `null`");
        }

        // Additional arguments.
        this.serializes("[\n    1,\n    2,\n    3,\n    [\n        4,\n        5\n    ]\n]", [1, 2, 3, [4, 5]], "Nested arrays");
        this.serializes("[]", [] : variant[], "Empty array; optional string");
        this.serializes("{}", {} : Map.<variant>, "Empty object; optional numeric");
        this.serializes("[\n    1\n]", [1], "Single-element array; optional numeric");
        this.serializes("{\n    \"foo\": 123\n}", { "foo": 123 }, "Single-member object; optional string");
        this.serializes("{\n    \"foo\": {\n        \"bar\": [\n            123\n        ]\n    }\n}", {"foo": {"bar": [123]}}, "Nested objects");

        this.serializes("{\n    \"bar\": 456,\n    \"foo\": 123\n}", { "foo": 123, "bar": 456 }, "Object are sorted by key");
    }

    /*
     * The following tests are adapted from the ECMAScript 5 Conformance Suite.
     * Copyright 2009, Microsoft Corporation. Distributed under the New BSD License.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     *   - Redistributions of source code must retain the above copyright notice,
     *     this list of conditions and the following disclaimer.
     *   - Redistributions in binary form must reproduce the above copyright notice,
     *     this list of conditions and the following disclaimer in the documentation
     *     and/or other materials provided with the distribution.
     *   - Neither the name of Microsoft nor the names of its contributors may be
     *     used to endorse or promote products derived from this software without
     *     specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
     * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
     * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
     * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
     * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
     * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
     * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
     * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
     * POSSIBILITY OF SUCH DAMAGE.
    */
    function test_ECMAScript5Conformance () : void {
        var value = { "a1": { "b1": [1, 2, 3, 4], "b2": { "c1": 1, "c2": 2 } }, "a2": "a2" } : variant;

        // Section 15.12.1.1: The JSON Grammar.
        // ------------------------------------

        // Tests 15.12.1.1-0-1 thru 15.12.1.1-0-8.
        this.parseError("12\t\r\n 34", "Valid whitespace characters may not separate two discrete tokens");
        this.parseError("\u000b1234", "The vertical tab is not a valid whitespace character");
        this.parseError("\u000c1234", "The form feed is not a valid whitespace character");
        this.parseError("\u00a01234", "The non-breaking space is not a valid whitespace character");
        this.parseError("\u200b1234", "The zero-width space is not a valid whitespace character");
        this.parseError("\ufeff1234", "The byte order mark (zero-width non-breaking space) is not a valid whitespace character");
        this.parseError("\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u30001234", "Other Unicode category `Z` characters are not valid whitespace characters");
        this.parseError("\u2028\u20291234", "The line (U+2028) and paragraph (U+2029) separators are not valid whitespace characters");

        // Test 15.12.1.1-0-9.
        this.parses({ "property": {} : variant, "prop2": [true, null, 123.456] },
        '\t\r \n{\t\r \n' +
        '"property"\t\r \n:\t\r \n{\t\r \n}\t\r \n,\t\r \n' +
        '"prop2"\t\r \n:\t\r \n' +
        '[\t\r \ntrue\t\r \n,\t\r \nnull\t\r \n,123.456\t\r \n]' +
        '\t\r \n}\t\r \n',
        "Valid whitespace characters may precede and follow all tokens");

        // Tests 15.12.1.1-g1-1 thru 15.12.1.1-g1-4.
        this.parses(1234, "\t1234", "Leading tab characters should be ignored");
        this.parseError("12\t34", "A tab character may not separate two disparate tokens");
        this.parses(1234, "\r1234", "Leading carriage returns should be ignored");
        this.parseError("12\r34", "A carriage return may not separate two disparate tokens");
        this.parses(1234, "\n1234", "Leading line feeds should be ignored");
        this.parseError("12\n34", "A line feed may not separate two disparate tokens");
        this.parses(1234, " 1234", "Leading space characters should be ignored");
        this.parseError("12 34", "A space character may not separate two disparate tokens");

        // Tests 15.12.1.1-g2-1 thru 15.12.1.1-g2-5.
        this.parses("abc", '"abc"', "Strings must be enclosed in double quotes");
        this.parseError("'abc'", "Single-quoted strings are not permitted");
        // Note: the original test 15.12.1.1-g2-3 (`"\u0022abc\u0022"`) is incorrect,
        // as the JavaScript interpreter will always convert `\u0022` to `"`.
        this.parseError("\\u0022abc\\u0022", "Unicode-escaped double quote delimiters are not permitted");
        this.parseError('"ab'+"c'", "Strings must terminate with a double quote character");
        this.parses("", '""', "Strings may be empty");

        // Tests 15.12.1.1-g4-1 thru 15.12.1.1-g4-4.
        this.parseError('"\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007"', "Unescaped control characters in the range [U+0000, U+0007] are not permitted within strings");
        this.parseError('"\u0008\u0009\u000a\u000b\u000c\u000d\u000e\u000f"', "Unescaped control characters in the range [U+0008, U+000F] are not permitted within strings");
        this.parseError('"\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017"', "Unescaped control characters in the range [U+0010, U+0017] are not permitted within strings");
        this.parseError('"\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f"', "Unescaped control characters in the range [U+0018, U+001F] are not permitted within strings");

        // Tests 15.12.1.1-g5-1 thru 15.12.1.1-g5-3.
        this.parses("X", '"\\u0058"', "Unicode escape sequences are permitted within strings");
        this.parseError('"\\u005"', "Unicode escape sequences may not comprise fewer than four hexdigits");
        this.parseError('"\\u0X50"', "Unicode escape sequences may not contain non-hex characters");

        // Tests 15.12.1.1-g6-1 thru 15.12.1.1-g6-7.
        this.parses("/", '"\\/"', "Escaped solidus");
        this.parses("\\", '"\\\\"', "Escaped reverse solidus");
        this.parses("\b", '"\\b"', "Escaped backspace");
        this.parses("\f", '"\\f"', "Escaped form feed");
        this.parses("\n", '"\\n"', "Escaped line feed");
        this.parses("\r", '"\\r"', "Escaped carriage return");
        this.parses("\t", '"\\t"', "Escaped tab");

        // Section 15.12.3: `SJSON.stringify()`.
        // ------------------------------------

        // Test 15.12.3-11-1 thru 5.12.3-11-15.
        /*this.serializes('"replacement"', void 0, "The `SJSON.stringify` callback function can be called on a top-level `undefined` value", function (key, value) {
      return "replacement";
    });*/
        this.serializes('"a string"', "a string", "`SJSON.stringify` should serialize top-level string primitives");
        this.serializes("123", 123, "`SJSON.stringify` should serialize top-level number primitives");
        this.serializes("true", true, "`SJSON.stringify` should serialize top-level Boolean primitives");
        this.serializes("null", null, "`SJSON.stringify` should serialize top-level `null` values");
        this.serializes("42", new Number(42), "`SJSON.stringify` should serialize top-level number objects");
        this.serializes('"wrapped"', new String("wrapped"), "`SJSON.stringify` should serialize top-level string objects");
        this.serializes("false", new Boolean(false), "`SJSON.stringify` should serialize top-level Boolean objects");
        /*this.serializes(void 0, 42, "The `SJSON.stringify` callback function may return `undefined` when called on a top-level number primitive", function () {
            return void 0;
        });
        /*this.serializes(void 0, { "prop": 1 }, "The `SJSON.stringify` callback function may return `undefined` when called on a top-level object", function () {
            return void 0;
        });*/
        /*this.serializes("[\n    4,\n    2\n]", 42, "The `SJSON.stringify` callback function may return an array when called on a top-level number primitive", function (key, value) {
            return value == 42 ? [4, 2] : value;
        });*/
        /*this.serializes('{\n    "forty": 2\n}', 42, "The `SJSON.stringify` callback function may return an object literal when called on a top-level number primitive", function (key, value) {
            return value == 42 ? { "forty": 2 } : value;
        });
        this.serializes(void 0, function () {}, "`SJSON.stringify` should return `undefined` when called on a top-level function");
        this.serializes("99", function () {}, "The `SJSON.stringify` callback function may return a number primitive when called on a top-level function", function () {
            return 99;
        });*/

        // Test 15.12.3-4-1.
        //this.serializes("[\n    42\n]", [42], "`SJSON.stringify` should ignore `filter` arguments that are not functions or arrays", {});

        // Test 15.12.3-5-a-i-1 and 15.12.3-5-b-i-1.
        this.equal(SJSON.stringify(value, 5), SJSON.stringify(value, 5), "Optional `width` argument: Number object and primitive width values should produce identical results");

        // Test 15.12.3-6-a-1 and 15.12.3-6-a-2.
        this.equal(SJSON.stringify(value, 10), SJSON.stringify(value, 100), "Optional `width` argument: The maximum numeric width value should be 10");
        // Test 15.12.3-6-b-1 and 15.12.3-6-b-4.
        this.equal(SJSON.stringify(value, 0), SJSON.stringify(value), "Optional `width` argument: Zero should be ignored");
        this.equal(SJSON.stringify(value, -5), SJSON.stringify(value), "Optional `width` argument: Negative numeric values should be ignored");
        this.equal(SJSON.stringify(value, 5), SJSON.stringify(value, "     "), "Optional `width` argument: Numeric width values in the range [1, 10] should produce identical results to that of string values containing `width` spaces");

        // Test 15.12.3-7-a-1.
        this.equal(SJSON.stringify(value, "0123456789xxxxxxxxx"), SJSON.stringify(value, "0123456789"), "Optional `width` argument: String width values longer than 10 characters should be truncated");

        // Test 15.12.3-8-a-1 thru 15.12.3-8-a-5.
        this.equal(SJSON.stringify(value, ""), SJSON.stringify(value), "Empty string `width` arguments should be ignored");
        this.equal(SJSON.stringify(value), SJSON.stringify(value), "Object literal `width` arguments should be ignored");

        // Test 15.12.3@2-2-b-i-1.
        /*this.serializes('[\n    "fortytwo objects"\n]', [{
            "prop": 42,
            "toJSON": function () {
            return "fortytwo objects";
        }
        }], "An object literal with a custom `toJSON` method nested within an array may return a string primitive for serialization");*/

    // Test 15.12.3@2-2-b-i-2.
    /*
    this.serializes('[\n    42\n]', [{
      "prop": 42,
      "toJSON": function () {
        return new Number(42);
      }
    }], "An object literal with a custom `toJSON` method nested within an array may return a number object for serialization");

    // Test 15.12.3@2-2-b-i-3.
    this.serializes('[\n    true\n]', [{
      "prop": 42,
      "toJSON": function () {
        return new Boolean(true);
      }
    }], "An object liyeral with a custom `toJSON` method nested within an array may return a Boolean object for serialization");

    // Test 15.12.3@2-3-a-1.
    this.serializes('[\n    "fortytwo"\n]', [42], "The `SJSON.stringify` callback function may return a string object when called on an array", function (key, value) {
      return value === 42 ? new String("fortytwo") : value;
    });

    // Test 15.12.3@2-3-a-2.
    this.serializes('[\n    84\n]', [42], "The `SJSON.stringify` callback function may return a number object when called on an array", function (key, value) {
      return value === 42 ? new Number(84) : value;
    });

    // Test 15.12.3@2-3-a-3.
    this.serializes('[\n    false\n]', [42], "The `SJSON.stringify` callback function may return a Boolean object when called on an array", function (key, value) {
      return value === 42 ? new Boolean(false) : value;
    });
    */
        // Test 15.12.3@4-1-2. 15.12.3@4-1-1 only tests whether an exception is
        // thrown; the type of the exception is not checked.
        var value2 = {} : variant;
        value2['prop'] = value2;
        this.cyclicError(value2, "An object containing a circular reference should throw a `TypeError`");

        // Test 15.12.3@4-1-3, modified to ensure that a `TypeError` is thrown.
        var value3 = { "p1": { "p2": {} : variant } } : variant;
        value3['p1']['p2']['prop'] = value3;
        this.cyclicError(value3, "A nested cyclic structure should throw a `TypeError`");
    }

    /*
  testSuite.addTest("Anticipated ECMAScript 6 Additions", function () {
    var expected = 0, value;
    try {
      value = {};
      // IE 8 only allows properties to be defined on DOM elements. Credits:
      // John-David Dalton and Juriy Zaytsev.
      if (Object.defineProperty(value, value, value), "value" in Object.getOwnPropertyDescriptor(value, value)) {
        expected += 1;
        value = [0, 1, 2, 3];
        Object.prototype[3] = 3;
        Object.defineProperty(value, 1, {
          "get": function () {
            Object.defineProperty(value, 4, { "value": 4 });
            delete value[2];
            delete value[3];
            value[5] = 5;
            return 1;
          }
        });
        // Test by Jeff Walden and Allen Wirfs-Brock.
        this.serializes('{\n    "0": {\n        "1": {\n            "3": {\n                "3": 3\n            }\n        },\n        "3": 3\n    },\n    "3": 3\n}', { 0: { 1: { 3: { 4: { 5: { 2: "omitted" } } } } } }, "Issue #12: `parse` should process property name arrays sequentially", value);
      }
    } catch (exception) {}
    // Clean up.
    delete Object.prototype[3];
    this.done(expected);
  });
*/
}

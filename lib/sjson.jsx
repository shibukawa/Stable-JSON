/*!
 * SJSON v1.0.0 | https://github.com/shibukawa/Stable-JSON | Copyright 2012, Yoshiki Shibukawa | http://shibu.mit-license.org
 * This code is based on https://github.com/bestiejs/json3. Thank you Kit Cambridge.
 */
/*
;(function () {
  // Convenience aliases.
  var getClass = {}.toString, isProperty;

  // Detect the `define` function exposed by asynchronous module loaders and set
  // up the internal `SJSON` namespace. The strict equality check for `define`
  // is necessary for compatibility with the RequireJS optimizer (`r.js`).
  var isLoader = typeof define === "function" && define.amd, SJSON = typeof exports == "object" && exports;

  // A JSON source string used to test the native `stringify` and `parse`
  // implementations.
  var serialized = '{"A":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';

  // Feature tests to determine whether the native `JSON.stringify` and `parse`
  // implementations are spec-compliant. Based on work by Ken Snyder.
  var stringifySupported, Escapes, toPaddedString, quote, serialize;
  var parseSupported, fromCharCode, Unescapes, abort, lex, get, walk, update, Index, Source;

  // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
  var value = new Date(-3509827334573292), floor, Months, getDay;

  try {
    // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
    // results for certain dates in Opera >= 10.53.
    value = value.getUTCFullYear() == -109252 && value.getUTCMonth() === 0 && value.getUTCDate() == 1 &&
      // Safari < 2.0.2 stores the internal millisecond time value correctly,
      // but clips the values returned by the date methods to the range of
      // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
      value.getUTCHours() == 10 && value.getUTCMinutes() == 37 && value.getUTCSeconds() == 6 && value.getUTCMilliseconds() == 708;
  } catch (exception) {}

  // Define additional utility methods if the `Date` methods are buggy.
  if (!value) {
    floor = Math.floor;
    // A mapping between the months of the year and the number of days between
    // January 1st and the first of the respective month.
    Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    // Internal: Calculates the number of days between the Unix epoch and the
    // first day of the given month.
    getDay = function (year, month) {
      return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
    };
  }

  // Export JSON 3 for asynchronous module loaders, CommonJS environments, web
  // browsers, and JavaScript engines. Credits: Oyvind Sean Kinsey.
  if (isLoader || SJSON) {
    if (isLoader) {
      // Export for asynchronous module loaders. The `SJSON` namespace is
      // redefined because module loaders do not provide the `exports` object.
      define("json", (SJSON = {}));
    }
    if (typeof JSON == "object" && JSON) {
      // Delegate to the native `stringify` and `parse` implementations in
      // asynchronous module loaders and CommonJS environments.
      SJSON.stringify = JSON.stringify;
      SJSON.parse = JSON.parse;
    }
  } else {
    // Export for browsers and JavaScript engines.
    SJSON = this.JSON || (this.JSON = {});
  }

  // Test `JSON.stringify`.
  if ((stringifySupported = typeof SJSON.stringify == "function" && !getDay)) {
    // A test function object with a custom `toJSON` method.
    (value = function () {
      return 1;
    }).toJSON = value;
    try {
      stringifySupported =
        // Firefox 3.1b1 and b2 serialize string, number, and boolean
        // primitives as object literals.
        SJSON.stringify(0) === "0" &&
        // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
        // literals.
        SJSON.stringify(new Number()) === "0" &&
        SJSON.stringify(new String()) == '""' &&
        // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
        // does not define a canonical JSON representation (this applies to
        // objects with `toJSON` properties as well, *unless* they are nested
        // within an object or array).
        SJSON.stringify(getClass) === undef &&
        // IE 8 serializes `undefined` as `"undefined"`. Safari 5.1.2 and FF
        // 3.1b3 pass this test.
        SJSON.stringify(undef) === undef &&
        // Safari 5.1.2 and FF 3.1b3 throw `Error`s and `TypeError`s,
        // respectively, if the value is omitted entirely.
        SJSON.stringify() === undef &&
        // FF 3.1b1, 2 throw an error if the given value is not a number,
        // string, array, object, Boolean, or `null` literal. This applies to
        // objects with custom `toJSON` methods as well, unless they are nested
        // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
        // methods entirely.
        SJSON.stringify(value) === "1" &&
        SJSON.stringify([value]) == "[1]" &&
        // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
        // `"[null]"`.
        SJSON.stringify([undef]) == "[null]" &&
        // YUI 3.0.0b1 fails to serialize `null` literals.
        SJSON.stringify(null) == "null" &&
        // FF 3.1b1, 2 halts serialization if an array contains a function:
        // `[1, true, getClass, 1]` serializes as "[1,true,],". These versions
        // of Firefox also allow trailing commas in JSON objects and arrays.
        // FF 3.1b3 elides non-JSON values from objects and arrays, unless they
        // define custom `toJSON` methods.
        SJSON.stringify([undef, getClass, null]) == "[null,null,null]" &&
        // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
        // where character escape codes are expected (e.g., `\b` => `\u0008`).
        SJSON.stringify({ "result": [value, true, false, null, "\0\b\n\f\r\t"] }) == serialized &&
        // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
        SJSON.stringify(null, value) === "1" &&
        SJSON.stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
        // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
        // serialize extended years.
        SJSON.stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
        // The milliseconds are optional in ES 5, but required in 5.1.
        SJSON.stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
        // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
        // four-digit years instead of six-digit years. Credits: @Yaffle.
        SJSON.stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
        // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
        // values less than 1000. Credits: @Yaffle.
        SJSON.stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
    } catch (exception) {
      stringifySupported = false;
    }
  }

  // Test `JSON.parse`.
  if (typeof SJSON.parse == "function") {
    try {
      // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
      // Conforming implementations should also coerce the initial argument to
      // a string prior to parsing.
      if (SJSON.parse("0") === 0 && !SJSON.parse(false)) {
        // Simple parsing test.
        value = SJSON.parse(serialized);
        if ((parseSupported = value.A.length == 5 && value.A[0] == 1)) {
          try {
            // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
            parseSupported = !SJSON.parse('"\t"');
          } catch (exception) {}
          if (parseSupported) {
            try {
              // FF 4.0 and 4.0.1 allow leading `+` signs, and leading and
              // trailing decimal points. FF 4.0, 4.0.1, and IE 9 also allow
              // certain octal literals.
              parseSupported = SJSON.parse("01") != 1;
            } catch (exception) {}
          }
        }
      }
    } catch (exception) {
      parseSupported = false;
    }
  }

  // Clean up the variables used for the feature tests.
  value = serialized = null;

  if (!stringifySupported || !parseSupported) {
    // Internal: Determines if a property is a direct property of the given
    // object. Delegates to the native `Object#hasOwnProperty` method.
    if (!(isProperty = {}.hasOwnProperty)) {
      isProperty = function (property) {
        var members = {}, constructor;
        if ((members.__proto__ = null, members.__proto__ = {
          // The *proto* property cannot be set multiple times in recent
          // versions of Firefox and SeaMonkey.
          "toString": 1
        }, members).toString != getClass) {
          // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
          // supports the mutable *proto* property.
          isProperty = function (property) {
            // Capture and break the object's prototype chain (see section 8.6.2
            // of the ES 5.1 spec). The parenthesized expression prevents an
            // unsafe transformation by the Closure Compiler.
            var original = this.__proto__, result = property in (this.__proto__ = null, this);
            // Restore the original prototype chain.
            this.__proto__ = original;
            return result;
          };
        } else {
          // Capture a reference to the top-level `Object` constructor.
          constructor = members.constructor;
          // Use the `constructor` property to simulate `Object#hasOwnProperty` in
          // other environments.
          isProperty = function (property) {
            var parent = (this.constructor || constructor).prototype;
            return property in this && !(property in parent && this[property] === parent[property]);
          };
        }
        members = null;
        return isProperty.call(this, property);
      };
    }

    // Public: Serializes a JavaScript `value` as a JSON string. The optional
    // `filter` argument may specify either a function that alters how object and
    // array members are serialized, or an array of strings and numbers that
    // indicates which properties should be serialized. The optional `width`
    // argument may be either a string or number that specifies the indentation
    // level of the output.
    if (!stringifySupported) {
      // Internal: A map of control characters and their escaped equivalents.

      // Internal: Converts `value` into a zero-padded string such that its
      // length is at least equal to `width`. The `width` must be <= 6.

    */

class SJSON
{
     static const Escapes = {
        "\\": "\\\\",
        '"': '\\"',
        "\b": "\\b",
        "\f": "\\f",
        "\n": "\\n",
        "\r": "\\r",
        "\t": "\\t"
    };

    static function stringify (source : variant) : string {
        return SJSON.stringify(source, '');
    }

    static function stringify (source : variant, width : int) : string {
        var whitespace = "";
        if ((width -= width % 1) > 0) {
            for (width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
        }
        return SJSON.stringify(source, whitespace);
    }

    static function stringify (source : variant, whitespace : string) : string {
        whitespace = whitespace.length <= 10 ? whitespace : whitespace.slice(0, 10);
        var value = {} : Map.<variant>;
        value[''] = source;
        return SJSON.serialize("", value, whitespace, "", []);
    }

    static function toPaddedString (width : int, value : int) : string {
        return ("000000" + (value ? value : 0) as string).slice(-width);
    }

    static function toPaddedString (width : int, value : string) : string {
        return ("000000" + (value ? value : '0')).slice(-width);
    }

    // Internal: Double-quotes a string `value`, replacing all ASCII control
    // characters (characters with code unit values between 0 and 31) with
    // their escaped equivalents. This is an implementation of the
    // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
    static function quote (value : string) : string {
        var result = '"', index = 0, symbol;
        for (; symbol = value.charAt(index); index++) {
            // Escape the reverse solidus, double quote, backspace, form feed, line
            // feed, carriage return, and tab characters.
            result += '\\"\b\f\n\r\t'.indexOf(symbol) > -1 ? SJSON.Escapes[symbol] :
                // If the character is a control character, append its Unicode escape
                // sequence; otherwise, append the character as-is.
                symbol < " " ? "\\u00" + SJSON.toPaddedString(2, symbol.charCodeAt(0).toString(16)) : symbol;
        }
        return result + '"';
    }

    // Internal: Recursively serializes an object. Implements the
    // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
    static function serialize (property : string, object : Map.<variant>, whitespace : string, indentation : string, stack : variant[]) : Nullable.<string>
    {
        var value = object[property];
        var results;
        if (value instanceof Map.<variant> && value) {
            if (value instanceof Date) {
                if ((value as number) > -1 / 0 && (value as number) < 1 / 0) {
                    // Dates are serialized according to the `Date#toJSON` method
                    // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
                    // for the ISO 8601 date time string format.
                    var datevalue = value as Date;
                    var year = datevalue.getUTCFullYear();
                    var month = datevalue.getUTCMonth();
                    var date = datevalue.getUTCDate();
                    var hours = datevalue.getUTCHours();
                    var minutes = datevalue.getUTCMinutes();
                    var seconds = datevalue.getUTCSeconds();
                    var milliseconds = datevalue.getUTCMilliseconds();
                    // Serialize extended years correctly.
                    value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + SJSON.toPaddedString(6, year < 0 ? -year : year) : SJSON.toPaddedString(4, year)) +
                        "-" + SJSON.toPaddedString(2, month + 1) + "-" + SJSON.toPaddedString(2, date) +
                        // Months, dates, hours, minutes, and seconds should have two
                        // digits; milliseconds should have three.
                        "T" + SJSON.toPaddedString(2, hours) + ":" + SJSON.toPaddedString(2, minutes) + ":" + SJSON.toPaddedString(2, seconds) +
                        // Milliseconds are optional in ES 5.0, but required in 5.1.
                        "." + SJSON.toPaddedString(3, milliseconds) + "Z";
                } else {
                    value = null;
                }
            }
        }
        if (value == null) {
            return "null";
        }
        var className = typeof value;
        if (className == 'boolean') {
            // Booleans are represented literally.
            return value as string;
        } else if (className == 'number') {
            // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
            // `"null"`.
            return (value as number) > -1 / 0 && (value as number) < 1 / 0 ? value as string : "null";
        } else if (className == 'string') {
            // Strings are double-quoted and escaped.
            return SJSON.quote(value as string);
        }
        // Recursively serialize objects and arrays.
        if (typeof value == "object") {
            // Check for cyclic structures. This is a linear search; performance
            // is inversely proportional to the number of unique nested objects.
            for (var length = stack.length; length--;) {
                if (stack[length] == value) {
                    // Cyclic structures cannot be serialized by `JSON.stringify`.
                    throw new TypeError('Cyclic structure found [key:' + property + ' same object depth: ' + length as string + ']');
                }
            }
            // Add the object to the stack of traversed objects.
            stack.push(value);
            var results = [] : string[];
            // Save the current indentation level and indent one additional level.
            var prefix = indentation;
            indentation += whitespace;
            if (value instanceof Array.<variant>) {
                // Recursively serialize array elements.
                var arrayvalue = value as Array.<variant>;
                var any = false;
                var length = arrayvalue.length;
                for (var index = 0; index < length; any || (any = true), index++) {
                    var element = SJSON.serialize(index as string, value as Map.<variant>, whitespace, indentation, stack);
                    results.push(element == null ? "null" : element);
                }
                stack.pop();
                return any ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
            } else {
                var property_strings = [] : string[][];
                var objvalue = value as Map.<variant>;
                var any = false;
                for (var key in objvalue)
                {
                    if (objvalue.hasOwnProperty(key))
                    {
                        var element = SJSON.serialize(key, objvalue, whitespace, indentation, stack);
                        if (element != null) {
                            property_strings.push([key, SJSON.quote(property) + ":" + (whitespace ? " " : "") + element]);
                        }
                        any || (any = true);
                    }
                }
                property_strings.sort(function (a, b) : number {
                    if(a[0] > b[0]) return 1.0;
                    if(a[0] < b[0]) return -1.0;
                    return 0.0;
                });
                for (var i = 0; i < property_strings.length; i++)
                {
                    results.push(property_strings[i][1]);
                }
                stack.pop();
                return any ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
            }
        }
        return null;
    }

    static function parse (input : string) : variant
    {
        return JSON.parse(input);
    }
}

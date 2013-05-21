/*!
 * SJSON v1.0.0 | https://github.com/shibukawa/Stable-JSON | Copyright 2012, Yoshiki Shibukawa | http://shibu.mit-license.org
 * This code is based on https://github.com/bestiejs/json3. Thank you Kit Cambridge.
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

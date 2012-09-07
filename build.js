#!/usr/bin/env node

/* JSON 3 Builder | http://bestiejs.github.com/json3 */
var path = require("path"), fs = require("fs"), gzip = require("zlib").gzip, spawn = require("child_process").spawn, marked = require(path.join(__dirname, "vendor", "marked")),

// The path to the Closure Compiler `.jar` file.
closurePath = path.join(__dirname, "vendor", "closure-compiler.jar"),

// The Closure Compiler options: enable advanced optimizations and suppress all
// warnings apart from syntax and optimization errors.
closureOptions = ["--compilation_level=ADVANCED_OPTIMIZATIONS", "--warning_level=QUIET"];

// Compress JSON 3 using the Closure Compiler.
fs.readFile(path.join(__dirname, "lib", "sjson.js"), "utf8", function readSource(exception, source) {
  var error, output, compiler, results;
  if (exception) {
    console.log(exception);
  } else {
    // Shell out to the Closure Compiler. Requires Java 6 or higher.
    error = output = "";
    compiler = spawn("java", ["-jar", closurePath].concat(closureOptions));
    compiler.stdout.on("data", function onData(data) {
      // Append the data to the output stream.
      output += data;
    });
    compiler.stderr.on("data", function onError(data) {
      // Append the error message to the error stream.
      error += data;
    });
    compiler.on("exit", function onExit(status) {
      var exception;
      // `status` specifies the process exit code.
      if (status) {
        exception = new Error(error);
        exception.status = status;
      }
      compressSource(exception, output);
    });
    // Proxy the source to the Closure Compiler. The top-level
    // immediately-invoked function expression is removed, as the output is
    // automatically wrapped in one.
    compiler.stdin.end(source.replace(/^;?\(function\s*\(\)\s*\{([\s\S]*?)}\)\.call\(this\);*?/m, "$1"));
  }

  // Post-processes the compressed source and writes the result to disk.
  function compressSource(exception, compressed) {
    if (exception) {
      console.log(exception);
    } else {
      // Extract the JSON 3 header and wrap the compressed source in an
      // IIFE (enabling advanced optimizations causes the Compiler to add
      // variables to the global scope).
      compressed = extractComments(source)[0] + "\n;(function(){" + compressed + "}());";
      // Write the compressed version to disk.
      fs.writeFile(path.join(__dirname, "lib", "sjson.min.js"), compressed, writeSource);
    }

    // Checks the `gzip`-ped size of the compressed version by shelling out to the
    // Unix `gzip` executable.
    function writeSource(exception) {
      console.log(exception || "Compressed version generated successfully.");
      // Automatically check the `gzip`-ped size of the compressed version.
      gzip(compressed, function (exception, results) {
        console.log("Compressed version size: %d bytes.", results.length);
      });
    }
  }
});

// Internal: Extracts line and block comments from a JavaScript `source`
// string. Returns an array containing the comments.
function extractComments(source) {
  var index = 0, length = source.length, results = [], symbol, position, original;
  while (index < length) {
    symbol = source[index];
    switch (symbol) {
      // Parse line and block comments.
      case "/":
        original = symbol;
        symbol = source[++index];
        switch (symbol) {
          // Extract line comments.
          case "/":
            position = source.indexOf("\n", index);
            if (position < 0) {
              // Check for CR line endings.
              position = source.indexOf("\r", index);
            }
            results.push(original + source.slice(index, index = position < 0 ? length : position));
            break;
          // Extract block comments.
          case "*":
            position = source.indexOf("*/", index);
            if (position < 0) {
              throw SyntaxError("Unterminated block comment.");
            }
            // Advance past the end of the comment.
            results.push(original + source.slice(index, index = position += 2));
            break;
          default:
            index++;
        }
        break;
      // Parse strings separately to ensure that any JavaScript comments within
      // them are preserved.
      case '"':
      case "'":
        for (position = index, original = symbol; index < length;) {
          symbol = source[++index];
          if (symbol == "\\") {
            // Skip past escaped characters.
            index++;
          } else if ("\n\r\u2028\u2029".indexOf(symbol) > -1) {
            // According to the ES 5.1 spec, strings may not contain unescaped
            // line terminators.
            throw SyntaxError("Illegal line continuation.");
          } else if (symbol == original) {
            break;
          }
        }
        if (source[index] == original) {
          index++;
          break;
        }
        throw SyntaxError("Unterminated string.");
      default:
        // Advance to the next character.
        index++;
    }
  }
  return results;
}

import test from "ava";
import tokamak from "../src/tokamak.js";
import { conclude } from "conclure";

test("basic integration test", async (t) => {
  let requireGraph = {};

  const fileMap = {
    "file:///file1.js": 'import test from "ava";\nexport default 42;',
  };

  const loader = {
    load: function* load(url) {
      if (!url.startsWith("file://")) {
        throw new Error(`Don't know how to load ${url}`);
      }

      requireGraph[url] = {
        id: url,
        code: fileMap[url], // this gets transpiled later
      };

      return requireGraph[url];
    },
    isDirectory(url) {
      return false;
    },
    isFile(url) {
      return true;
    },
  };

  const loadModule = tokamak({
    loader,
    logger: (level, ...messages) => {
      console.log(`[${level.toUpperCase()}]`, ...messages);
    },
  });

  await conclude(
    (function* () {
      yield loadModule("file:///file1.js");
    })(),
    (err, contents) => {
      if (err) console.error(err);
      else console.log(contents);
    }
  );

  t.deepEqual(requireGraph, {
    "file:///file1.js": {
      id: "file:///file1.js",
      code:
        "const __ellx_import__0 = require('ava');\n" +
        "var test = 'default' in __ellx_import__0 ? __ellx_import__0.default : __ellx_import__0;\n" +
        "\n" +
        "exports.default = 42;",
      imports: { ava: { default: "test" } },
      required: [],
    },
    "file:///package.json": { id: "file:///package.json", code: undefined },
  });
});

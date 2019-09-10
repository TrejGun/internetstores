import {deepStrictEqual} from "assert";
import {getConfig} from "../src/utils/config";


describe("Main", function () {
  it("production->data + $env->data + production->data + $env->data", async function () {
    process.env.CONFIG_DIR = "./test/fixtures/case1";
    const config = await getConfig("checkout", "anpl", "development");
    deepStrictEqual(config, {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    });
  });

  it("production->data +  production->data", async function () {
    process.env.CONFIG_DIR = "./test/fixtures/case1";
    const config = await getConfig("checkout", "anpl", "production");
    deepStrictEqual(config, {
      a: 1,
      b: 1,
      c: 3,
      d: 3,
    });
  });

  it("production->data + $env->data + $siteId->production->data + $siteId->$env->data", async function () {
    process.env.CONFIG_DIR = "./test/fixtures/case2";
    const config = await getConfig("checkout", "anpl", "development");
    deepStrictEqual(config, {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    });
  });

  it("production->data + $siteId->production->data", async function () {
    process.env.CONFIG_DIR = "./test/fixtures/case2";
    const config = await getConfig("checkout", "anpl", "production");
    deepStrictEqual(config, {
      a: 1,
      b: 1,
      c: 3,
      d: 3,
    });
  });

  it("default->$env->data + default->$env->data", async function () {
    process.env.CONFIG_DIR = "./test/fixtures/case3";
    const config = await getConfig("checkout", "anpl", "development");
    deepStrictEqual(config, {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    });
  });

  it("default->production->data + default->production->data", async function () {
    process.env.CONFIG_DIR = "./test/fixtures/case3";
    const config = await getConfig("checkout", "anpl", "production");
    deepStrictEqual(config, {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    });
  });

  it("$env->data + $siteId->data", async function () {
    process.env.CONFIG_DIR = "./test/fixtures/case4";
    const config = await getConfig("checkout", "anpl", "development");
    deepStrictEqual(config, {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    });
  });

  it("production->data + $siteId->data", async function () {
    process.env.CONFIG_DIR = "./test/fixtures/case4";
    const config = await getConfig("checkout", "anpl", "production");
    deepStrictEqual(config, {
      a: 1,
      b: 1,
      c: 3,
      d: 4,
    });
  });

  it("data + $siteId->data [1]", async function () {
    process.env.CONFIG_DIR = "./test/fixtures/case5";
    const config = await getConfig("checkout", "anpl", "development");
    deepStrictEqual(config, {
      a: 1,
      b: 1,
      c: 3,
      d: 4,
    });
  });

  it("data + $siteId->data [2]", async function () {
    process.env.CONFIG_DIR = "./test/fixtures/case5";
    const config = await getConfig("checkout", "anpl", "production");
    deepStrictEqual(config, {
      a: 1,
      b: 1,
      c: 3,
      d: 4,
    });
  });

  it("data + $siteId->data [3]", async function () {
    process.env.CONFIG_DIR = "./test/fixtures/case5";
    const config = await getConfig("checkout", "bkbe", "development");
    deepStrictEqual(config, {
      a: 1,
      b: 1,
      c: 1,
      d: 1,
    });
  });
});

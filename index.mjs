import fs from "fs";
import path from "path";
import {promisify} from "util";
import yaml from "js-yaml";



function getItems(dirname) {
  return promisify(fs.readdir)(dirname)
    .then(items => items.map(item => path.join(dirname, item)));
}

function checkItems(items) {
  return Promise.all(items.map(item => promisify(fs.stat)(item)
    .then(stat => {
      if (stat.isFile()) {
        return item;
      } else { // isDir
        throw new Error(`${item} is not a file!`);
      }
    })
    .catch(console.error)))
    .then(files => {
      return files.filter(file => file);
    });
}

function readFiles(files) {
  return Promise.all(files.map(file => {
    return promisify(fs.readFile)(file)
      .then(buffer => {
        if (file.endsWith(".json")) {
          return JSON.parse(buffer);
        } else if (file.endsWith(".yml") || file.endsWith(".yaml")) {
          return yaml.safeLoad(buffer);
        } else {
          throw new Error(`${file} is not a config file!`);
        }
      })
      .catch(console.error);
  }))
    .then(configs => {
      return configs.filter(config => config);
    });
}

function isObject(item) {
  return (item && typeof item === "object" && !Array.isArray(item));
}

function mergeDeep(target, ...sources) {
  if (!sources.length) {
    return target;
  }
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, {[key]: {}});
        }
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, {[key]: source[key]});
      }
    }
  }

  return mergeDeep(target, ...sources);
}

const envs = ["development", "test", "staging", "production"];

function isEnvConfig(config) {
  return Object.keys(config).some(value => envs.includes(value));
}

async function getConfig(configName, siteId, environment) {
  const configDir = "./configs";

  // Get all files from config dir
  const items = await getItems(configDir);

  // console.log("items", items);
  /*
    'configs/checkout',
    'configs/checkout.html',
    'configs/checkout.json',
    'configs/checkout_anpl.json',
    'configs/checkout_bkbe.json',
    'configs/config.yml',
    'configs/config_bkbe.yml',
    'configs/forms_customer.yml',
    'configs/forms_customer_bkit.yml'
  */

  // Remove directories
  const files = await checkItems(items);

  // console.log("files", files);
  /*
    'configs/checkout.html',
    'configs/checkout.json',
    'configs/checkout_anpl.json',
    'configs/checkout_bkbe.json',
    'configs/config.yml',
    'configs/config_bkbe.yml',
    'configs/forms_customer.yml',
    'configs/forms_customer_bkit.yml'
  */

  // Filter files by name
  // After this point we can potentially have 6 valid files
  // - checkout.json
  // - checkout.yaml
  // - checkout.yml
  // - checkout_anpl.json
  // - checkout_anpl.yaml
  // - checkout_anpl.yml
  const filteredFiles = files.filter(file =>
    file.includes(`${configName}.`) ||
    file.includes(`${configName}_${siteId}.`),
  );

  // console.log("filteredFiles", filteredFiles);
  /*
    'configs/checkout.html',
    'configs/checkout.json',
    'configs/checkout_anpl.json'
  */

  const configs = await readFiles(filteredFiles);

  // At this point it does not matter which file has what config
  // because all configs could miss any level
  // and there may be more than one config in one file
  // so we have to add specificity points
  const specificity = [];
  configs.forEach((config, i) => {

    // extracting config with specificity
    // there are 8 cases and we start with most specific
    if (siteId in config) {

      if (isEnvConfig(config[siteId])) {
        // most specific case full path $siteId->$env->data
        if (environment in config[siteId]) {
          specificity.push([8 + i, config[siteId][environment]]);
        }
        // a bit less specific $siteId->production->data
        if (environment !== "production" && "production" in config[siteId]) {
          specificity.push([7 + i, config[siteId]["production"]]);
        }

        // this file has no config for this env
      }

      // this is site config siteId->data
      specificity.push([6 + i, config[siteId]]);
    } else
    // this is config for environment
    if (isEnvConfig(config)) {
      // pretty match specific config $env->data
      if (environment in config) {
        specificity.push([5 + i, config[environment]]);
      }

      // and a production one production->data
      if (environment !== "production" && "production" in config) {
        specificity.push([4 + i, config["production"]]);
      }
    } else
    // this is default config
    if ("default" in config) {
      if (isEnvConfig(config["default"])) {
        // default env config $env->data
        if (environment in config["default"]) {
          specificity.push([3 + i, config["default"][environment]]);
        }
        // default production config production->data
        if (environment !== "production" && "production" in config["default"]) {
          specificity.push([2 + i, config["default"]["production"]]);
        }

        // this file has no default config for this env
      }
    } else
    // file is a config itself
    {
      specificity.push([1 + i, config]);
    }
  });

  const sortedConfig = specificity.sort((a, b) => a[0] - b[0]);

  return mergeDeep(...sortedConfig.map(config => config[1]));
}

getConfig("checkout", "anpl", "staging")
  .then(config => console.log(JSON.stringify(config, null, "  ")))
  .catch(console.error);



import {checkItems, getItems, readFiles} from "./file";
import {mergeDeep} from "./object";


const envs = ["development", "test", "staging", "production"];

function isEnvConfig (config) {
  return Object.keys(config).some(value => envs.includes(value));
}

function isSiteIdConfig (config) {
  return Object.keys(config).every(value => (value.length >= 3 && value.length <= 6) || value === "default");
}

function push (specificity, value, environment, config) {
  if (isEnvConfig(config)) {
    if (environment in config) {
      specificity.push([value, config[environment]]);
    }
    if (environment !== "production" && "production" in config) {
      specificity.push([value - 1, config["production"]]);
    }
    // this file has no config for this env
  } else {
    specificity.push([value - 2, config]);
  }
}


export async function getConfig (configName, siteId, environment) {
  // Get all files from config dir
  const items = await getItems(process.env.CONFIG_DIR);


  // Remove directories
  const files = await checkItems(items);


  // Filter files by name
  // After this point we can potentially have 6 valid files
  // - checkout.json
  // - checkout.yaml
  // - checkout.yml
  // - checkout_anpl.json
  // - checkout_anpl.yaml
  // - checkout_anpl.yml
  const filteredFiles = files.filter(file =>
    file.includes(`${configName}.`)
    || file.includes(`${configName}_${siteId}.`),
  );

  const configs = await readFiles(filteredFiles);

  // At this point it does not matter which file has what config
  // because all configs could miss any level
  // and there may be more than one config in one file
  // so we have to add specificity points
  const specificity = [];
  configs.forEach((config, i) => {
    // extracting config with specificity
    // there are 9 cases and we start with most specific
    if (isSiteIdConfig(config)) {
      if (siteId in config) {
        push(specificity, 9 * (i + 1), environment, config[siteId]);
      } else if ("default" in config) {
        push(specificity, 6 * (i + 1), environment, config["default"]);
      }
      // this file has no config for this siteId
    } else {
      push(specificity, 3 * (i + 1), environment, config);
    }
  });

  const sortedConfig = specificity.sort((a, b) => a[0] - b[0]);

  return mergeDeep(...sortedConfig.map(config => config[1]));
}

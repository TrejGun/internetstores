import {promisify} from "util";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";


export function getItems (dirname) {
  return promisify(fs.readdir)(dirname)
    .then(items => items.map(item => path.join(dirname, item)));
}

export function checkItems (items) {
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

export function readFiles (files) {
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

import {getConfig} from "./utils/config";


process.env.CONFIG_DIR = "./configs";

getConfig("checkout", "anpl", "staging")
  .then(config => console.debug(JSON.stringify(config, null, "  ")))
  .catch(console.error);

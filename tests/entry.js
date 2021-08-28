/* eslint-disable security/detect-non-literal-require */
import { entry } from './constants.js';

const m = require(entry);

export default m.default;

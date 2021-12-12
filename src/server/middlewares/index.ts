import logger from './logger';
import checkMethod from './checkMethod';
import authenticate from "./auth";

// The order of middlewares matter
export default {
    checkMethod,
    logger,
    authenticate,
};

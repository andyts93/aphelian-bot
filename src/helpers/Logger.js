const pino = require('pino');

const today = new Date();
const logger = pino.default(
    {
        level: 'debug',
    },
    pino.multistream([
        {
            level: 'info',
            stream: pino.transport({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: "yyyy-mm-dd HH:mm:ss",
                    ignore: 'pid,hostname',
                    singleLine: false,
                    hideObject: true,
                    customColors: 'info:blue,warn:yellow,error:red'
                }
            })
        },
        {
            level: 'debug',
            stream: pino.destination({
                dest: `${process.cwd()}/logs/combined-${today.getFullYear()}.${today.getMonth()}.${today.getDate()}.log`,
                sync: true,
            })
        }
    ])
);

module.exports = class Logger {
    static success(content) {
        logger.info(content);
    }

    static log(content) {
        logger.info(content);
    }

    static warn(content) {
        logger.warn(content);
    }

    static error(content, ex) {
        if (ex) {
            logger.error(ex, `${content}: ${ex?.message}`)
        } else {
            logger.error(content);
        }
    }

    static debug(content) {
        logger.debug(content);
    }
}
// src/logger.js
const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.DailyRotateFile({
            filename: path.join(logDirectory, 'interaction_logs-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ]
});

const errorLogger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({ 
            filename: path.join(logDirectory, 'error_logs.json')
        })
    ]
});

function logError(error, context = 'No additional context') {
    if (process.env.LOGGING_ENABLED !== 'true') return;

    errorLogger.error({
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        additionalInfo: context
    });
}

function logInteraction(message, supportedChannels) {
    if (process.env.LOGGING_ENABLED !== 'true') return;

    const logData = {
        userId: message.author.id,
        username: message.author.tag,
        channelId: message.channel.id,
        channelName: message.channel.name,
        timestamp: new Date().toISOString(),
        content: message.content,
        messageType: message.type,
        additionalContext: 'Additional details if needed'
    };

    if (supportedChannels.includes(logData.channelId)) {
        logger.info(logData);
    }
}

function logPatternMatch(message, pattern) {
    if (process.env.LOGGING_ENABLED !== 'true') return;

    const logData = {
        userId: message.author.id,
        username: message.author.tag,
        channelId: message.channel.id,
        channelName: message.channel.name,
        timestamp: new Date().toISOString(),
        content: message.content,
        messageType: message.type,
        matchedPattern: pattern
    };

    logger.info(logData);
}

module.exports = {
    logInteraction,
    logError,
    logPatternMatch
};

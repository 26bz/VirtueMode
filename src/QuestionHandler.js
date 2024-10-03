// src/QuestionHandler.js
const { Client, GatewayIntentBits, TextChannel, EmbedBuilder, Collection } = require('discord.js');
const { logInteraction, logPatternMatch, logError } = require('./Logger');
const fs = require('fs');
const path = require('path');

class QuestionHandler {
    constructor(client) {
        this.client = client;
        this.questionsCache = new Collection();
        this.BLACKLISTED_CHANNELS = process.env.BLACKLISTED_CHANNELS?.split(',') || [];
        this.loadQuestions(path.join(__dirname, 'questions/minecraft'));

        this.client.on('messageCreate', this.handleMessage.bind(this));
    }

    loadQuestions(dir) {
        try {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const fileQuestions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                Object.values(fileQuestions).forEach(({ pattern, response }) => {
                    this.questionsCache.set(pattern, response);
                });
            });
        } catch (error) {
            console.error(`Error loading questions: ${error.message}`);
        }
    }

    isBlacklistedChannel(channel) {
        return this.BLACKLISTED_CHANNELS.includes(channel.id);
    }

    isSupportEnabled(channel) {
        return !this.isBlacklistedChannel(channel);
    }

    getResponse(content) {
        const lowerContent = content.toLowerCase();
        for (const [pattern, response] of this.questionsCache) {
            if (new RegExp(pattern, 'i').test(lowerContent)) {
                return { response, pattern: pattern.toString() };
            }
        }
        return null;
    }

    async handleMessage(message) {
        if (message.author.bot || !(message.channel instanceof TextChannel)) {
            return;
        }

        const content = message.content;
        const result = this.getResponse(content);

        if (result) {
            if (!this.isSupportEnabled(message.channel)) {
                await message.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('Support Disabled')
                        .setDescription("This channel isn't a supported channel or support is disabled in this channel.")
                        .setColor('#FF0000')]
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setDescription(result.response)
                .setColor('#00FF00')
                .setFooter({ text: 'Experience Virtue. Elevate Hosting.', iconURL: 'https://cdn.virtue-host.com/company/logo.png' });

            await message.reply({ embeds: [embed] });

            console.log('Logging pattern match');
            logPatternMatch(message, result.pattern);
            console.log('Logging interaction');
            logInteraction(message, this.BLACKLISTED_CHANNELS);
        }
    }
}

module.exports = QuestionHandler;

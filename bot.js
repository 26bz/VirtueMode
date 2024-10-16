require("dotenv").config();
require("module-alias/register");

require("@helpers/extenders/Message");
require("@helpers/extenders/Guild");
require("@helpers/extenders/GuildChannel");

const { checkForUpdates } = require("@helpers/BotUtils");
const { initializeMongoose } = require("@src/database/mongoose");
const { BotClient } = require("@src/structures");
const { validateConfiguration } = require("@helpers/Validator");
const QuestionHandler = require("./src/QuestionHandler"); 

validateConfiguration();

const client = new BotClient();
client.loadCommands("src/commands");
client.loadContexts("src/contexts");
client.loadEvents("src/events");

new QuestionHandler(client);

process.on("unhandledRejection", (err) =>
  client.logger.error(`Unhandled exception`, err),
);

(async () => {
  await checkForUpdates();

  if (client.config.DASHBOARD.enabled) {
    client.logger.log("Launching dashboard");
    try {
      const { launch } = require("@root/dashboard/app");
      await launch(client);
    } catch (ex) {
      client.logger.error("Failed to launch dashboard", ex);
    }
  } else {
    await initializeMongoose();
  }

  await client.login(process.env.BOT_TOKEN);
})();

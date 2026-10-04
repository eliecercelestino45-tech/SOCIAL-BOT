require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials
} = require("discord.js");

const verification = require("./verification");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Channel
  ]
});

client.once("ready", async () => {
  console.log(`✅ ${client.user.tag} está conectado.`);
  console.log(`🌐 Servidor configurado: ${process.env.GUILD_ID}`);

  try {
    await verification.sendVerificationPanel(client);
  } catch (error) {
    console.error("❌ No se pudo enviar el panel de verificación:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    await verification.handleInteraction(interaction);
  } catch (error) {
    console.error("❌ Error en la interacción:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Ocurrió un error. Inténtalo nuevamente.",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

process.on("unhandledRejection", (error) => {
  console.error("❌ Promesa rechazada:", error);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Error no controlado:", error);
});

client.login(process.env.DISCORD_TOKEN);

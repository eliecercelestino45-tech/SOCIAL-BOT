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
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Channel
  ]
});

// ─────────────────────────────────────────────
// BOT LISTO
// ─────────────────────────────────────────────

client.once("ready", async () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Social Bot conectado como ${client.user.tag}`);
  console.log(`🌐 Servidor: ${process.env.GUILD_ID}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    await verification.sendVerificationPanel(client);
  } catch (error) {
    console.error("❌ Error al enviar el panel:", error);
  }
});

// ─────────────────────────────────────────────
// INTERACCIONES
// ─────────────────────────────────────────────

client.on("interactionCreate", async (interaction) => {
  try {
    await verification.handleInteraction(interaction);
  } catch (error) {
    console.error("❌ Error en interacción:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Ocurrió un error. Inténtalo nuevamente.",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

// ─────────────────────────────────────────────
// MENSAJES
// ─────────────────────────────────────────────

client.on("messageCreate", async (message) => {
  try {
    // Ignorar mensajes enviados por bots
    if (message.author.bot) return;

    // Solo procesar mensajes privados
    if (!message.guild) {
      await verification.handleDM(message);
    }

  } catch (error) {
    console.error("❌ Error procesando mensaje:", error);
  }
});

// ─────────────────────────────────────────────
// ERRORES
// ─────────────────────────────────────────────

client.on("error", (error) => {
  console.error("❌ Error del cliente Discord:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("❌ Promesa rechazada:", error);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Error no controlado:", error);
});

// ─────────────────────────────────────────────
// INICIAR BOT
// ─────────────────────────────────────────────

if (!process.env.DISCORD_TOKEN) {
  console.error("❌ Falta DISCORD_TOKEN en las variables de entorno.");
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);

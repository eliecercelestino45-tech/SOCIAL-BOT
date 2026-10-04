const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

// Códigos activos en memoria
const verificationCodes = new Map();

// Generar código aleatorio
function generateCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 8; i++) {
    code += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return code;
}

// Enviar panel al canal configurado
async function sendVerificationPanel(client) {
  const channelId = process.env.VERIFY_CHANNEL_ID;
  const channel = await client.channels.fetch(channelId);

  if (!channel) {
    throw new Error("No se encontró el canal de verificación.");
  }

  const embed = new EmbedBuilder()
    .setTitle("🔐 Verificación")
    .setDescription(
      "Para acceder a la comunidad debes completar la verificación.\n\n" +
      "Pulsa el botón **✅ Verificar** para comenzar."
    )
    .setColor(0x5865F2)
    .setFooter({
      text: "Social Bot • Sistema de verificación"
    });

  const button = new ButtonBuilder()
    .setCustomId("social_verify")
    .setLabel("Verificar")
    .setEmoji("✅")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder()
    .addComponents(button);

  await channel.send({
    embeds: [embed],
    components: [row]
  });

  console.log("✅ Panel de verificación enviado.");
}

// Manejar interacciones
async function handleInteraction(interaction) {
  if (!interaction.isButton()) return;

  if (interaction.customId !== "social_verify") return;

  const member = interaction.member;

  // Comprobar si ya tiene el rol
  if (member.roles.cache.has(process.env.VERIFIED_ROLE_ID)) {
    return interaction.reply({
      content: "✅ Ya estás verificado.",
      ephemeral: true
    });
  }

  const code = generateCode();

  verificationCodes.set(interaction.user.id, {
    code,
    expires: Date.now() + 10 * 60 * 1000
  });

  try {
    await interaction.user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔐 Código de verificación")
          .setDescription(
            "Pega este código en el canal de verificación para continuar:\n\n" +
            `\`\`\`${code}\`\`\`\n` +
            "⏱️ Este código expira en **10 minutos**."
          )
          .setColor(0x5865F2)
          .setFooter({
            text: "Social Bot"
          })
      ]
    });

    await interaction.reply({
      content: "📩 Te envié el código por mensaje privado (MD).",
      ephemeral: true
    });

  } catch (error) {
    verificationCodes.delete(interaction.user.id);

    await interaction.reply({
      content:
        "❌ No pude enviarte un MD. Activa tus mensajes directos e inténtalo nuevamente.",
      ephemeral: true
    });
  }
}

// Comprobar un código
async function verifyCode(userId, code, guild) {
  const data = verificationCodes.get(userId);

  if (!data) {
    return {
      success: false,
      message: "❌ No tienes un código de verificación activo."
    };
  }

  if (Date.now() > data.expires) {
    verificationCodes.delete(userId);

    return {
      success: false,
      message: "⏰ Tu código ha expirado. Solicita uno nuevo."
    };
  }

  if (data.code !== code.toUpperCase()) {
    return {
      success: false,
      message: "❌ El código introducido es incorrecto."
    };
  }

  try {
    const member = await guild.members.fetch(userId);

    await member.roles.add(process.env.VERIFIED_ROLE_ID);

    verificationCodes.delete(userId);

    return {
      success: true,
      message: "✅ ¡Verificación completada! Se te ha otorgado el rol."
    };

  } catch (error) {
    console.error("Error otorgando el rol:", error);

    return {
      success: false,
      message: "❌ No pude otorgarte el rol. Revisa los permisos del bot."
    };
  }
}

module.exports = {
  sendVerificationPanel,
  handleInteraction,
  verifyCode
};

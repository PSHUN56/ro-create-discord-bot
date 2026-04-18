const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder
} = require("discord.js");
const { ROLE_DEFINITIONS, ROLE_SELECT_OPTIONS, buildServerTemplate } = require("./config");

async function ensureRoles(guild, ownerMember) {
  const roleIds = {};

  for (const roleDef of ROLE_DEFINITIONS) {
    const existingRole = guild.roles.cache.find((role) => role.name === roleDef.name);
    const role = existingRole || await guild.roles.create({
      name: roleDef.name,
      color: roleDef.color,
      hoist: roleDef.hoist,
      reason: "Initial Ro Create server setup"
    });

    roleIds[roleDef.key] = role.id;
  }

  if (ownerMember && !ownerMember.roles.cache.has(roleIds.founder)) {
    await ownerMember.roles.add(roleIds.founder, "Grant founder role to the server owner");
  }

  return roleIds;
}

async function ensureChannels(guild, roleIds) {
  const template = buildServerTemplate(guild, roleIds);
  const channelMap = {};

  for (const channelDef of template) {
    const parentId = channelDef.parentKey ? channelMap[channelDef.parentKey] : undefined;
    const existing = guild.channels.cache.find((channel) => channel.name === channelDef.name);

    const channel = existing || await guild.channels.create({
      name: channelDef.name,
      type: channelDef.type,
      parent: parentId,
      topic: channelDef.topic,
      permissionOverwrites: channelDef.permissionOverwrites,
      reason: "Initial Ro Create server setup"
    });

    if (!existing) {
      channelMap[channelDef.key] = channel.id;
      continue;
    }

    channelMap[channelDef.key] = existing.id;
    await existing.edit({
      parent: parentId,
      topic: channelDef.topic ?? existing.topic,
      permissionOverwrites: channelDef.permissionOverwrites
    });
  }

  return channelMap;
}

async function postPanels(guild, channelIds, roleIds, listingFee) {
  const verificationChannel = guild.channels.cache.get(channelIds.verification);
  const rolesChannel = guild.channels.cache.get(channelIds.chooseRoles);
  const checklistChannel = guild.channels.cache.get(channelIds.setupChecklist);
  const controlChannel = guild.channels.cache.get(channelIds.ownerControl);
  const coinHelpChannel = guild.channels.cache.get(channelIds.coinHelp);

  if (verificationChannel) {
    const verifyEmbed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle("Ro Create Verification")
      .setDescription("Когда откроешь канал для участников, они смогут нажать кнопку ниже и получить роль `Verified`.")
      .addFields(
        { name: "Что делать сейчас", value: "Пока канал приватный. Проверь текст, роли и оформление. Потом открой канал для `@everyone`." }
      );

    const verifyButton = new ButtonBuilder()
      .setCustomId("verify_me")
      .setLabel("Пройти верификацию")
      .setStyle(ButtonStyle.Success);

    await verificationChannel.send({
      embeds: [verifyEmbed],
      components: [new ActionRowBuilder().addComponents(verifyButton)]
    });
  }

  if (rolesChannel) {
    const rolesEmbed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle("Ro Create Role Picker")
      .setDescription("Участники с ролью `Verified` смогут выбрать специализации для поиска команд и заказов.");

    const rolesMenu = new StringSelectMenuBuilder()
      .setCustomId("role_picker")
      .setPlaceholder("Выбери свои роли")
      .setMinValues(1)
      .setMaxValues(ROLE_SELECT_OPTIONS.length)
      .addOptions(ROLE_SELECT_OPTIONS);

    await rolesChannel.send({
      embeds: [rolesEmbed],
      components: [new ActionRowBuilder().addComponents(rolesMenu)]
    });
  }

  if (checklistChannel) {
    const checklistEmbed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle("Checklist Before Launch")
      .setDescription([
        "1. Проверь созданные роли и при желании поменяй цвета/позиции.",
        "2. Открой `#verification`, `#choose-roles`, `#announcements`, `#portfolio-showcase`, `#developer-search`, `#resumes`, `#coins-and-commands` для `@everyone`, когда будешь готов.",
        "3. Заполни правила и описание сервера.",
        "4. Проверь, что роль бота выше выдаваемых ролей.",
        "5. После этого сервер можно открывать."
      ].join("\n"));

    await checklistChannel.send({ embeds: [checklistEmbed] });
  }

  if (controlChannel) {
    const controlEmbed = new EmbedBuilder()
      .setColor(0xef4444)
      .setTitle("One-Time Setup Complete")
      .setDescription("Бот создал структуру один раз. Повторный `/setup_server` теперь заблокирован, чтобы сервер сам не перестраивался.")
      .addFields(
        { name: "Текущая цена публикации", value: `${listingFee} монет` },
        { name: "Каналы пока приватные", value: "Это сделано специально, чтобы ты спокойно всё проверил и оформил вручную." }
      );

    await controlChannel.send({ embeds: [controlEmbed] });
  }

  if (coinHelpChannel) {
    const helpEmbed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle("Coins And Commands")
      .setDescription([
        "`/daily` - получить ежедневные монеты",
        "`/balance` - посмотреть баланс",
        "`/post_listing` - опубликовать объявление в поиск разработчиков или резюме",
        "`/grant_coins` - выдать монеты пользователю (только для админов)"
      ].join("\n"))
      .addFields(
        { name: "Цена публикации", value: `${listingFee} монет` }
      );

    await coinHelpChannel.send({ embeds: [helpEmbed] });
  }
}

module.exports = {
  ensureRoles,
  ensureChannels,
  postPanels
};

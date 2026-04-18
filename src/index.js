require("dotenv").config();

const {
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");
const { ROLE_SELECT_OPTIONS } = require("./config");
const { ensureRoles, ensureChannels, postPanels } = require("./setup");
const { readState, writeState, getGuildState, getUserState } = require("./storage");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const listingFee = Number.parseInt(process.env.POST_LISTING_FEE || "25", 10);

if (!token || !clientId) {
  throw new Error("DISCORD_TOKEN and CLIENT_ID are required in .env");
}

const commands = [
  new SlashCommandBuilder()
    .setName("setup_server")
    .setDescription("One-time private setup for the Ro Create server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily coins"),
  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Show your current coin balance")
    .addUserOption((option) =>
      option.setName("user").setDescription("User to check").setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("grant_coins")
    .setDescription("Give coins to a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option.setName("user").setDescription("User who gets coins").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("amount").setDescription("Coin amount").setRequired(true).setMinValue(1)
    ),
  new SlashCommandBuilder()
    .setName("post_listing")
    .setDescription("Post a paid listing in developer-search or resumes")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Where the post should go")
        .setRequired(true)
        .addChoices(
          { name: "Поиск разработчиков", value: "developer_search" },
          { name: "Резюме", value: "resume" }
        )
    )
    .addStringOption((option) =>
      option.setName("title").setDescription("Listing title").setRequired(true).setMaxLength(80)
    )
    .addStringOption((option) =>
      option.setName("description").setDescription("What should be posted").setRequired(true).setMaxLength(1000)
    )
    .addIntegerOption((option) =>
      option.setName("budget").setDescription("Budget or price in coins").setRequired(true).setMinValue(0)
    )
    .addStringOption((option) =>
      option.setName("payment").setDescription("How the payment works").setRequired(true).setMaxLength(120)
    )
    .addAttachmentOption((option) =>
      option.setName("image").setDescription("Optional image for the listing").setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("contact").setDescription("Optional contact text").setRequired(false).setMaxLength(120)
    )
].map((command) => command.toJSON());

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

function getListingChannelKey(type) {
  return type === "developer_search" ? "devSearch" : "resumes";
}

function createListingEmbed(interaction, options, publicationFee) {
  const embed = new EmbedBuilder()
    .setColor(options.type === "developer_search" ? 0x0ea5e9 : 0x22c55e)
    .setTitle(options.title)
    .setDescription(options.description)
    .addFields(
      { name: "Тип", value: options.type === "developer_search" ? "Поиск разработчиков" : "Резюме", inline: true },
      { name: "Бюджет / цена", value: `${options.budget} монет`, inline: true },
      { name: "Оплата", value: options.payment, inline: true },
      { name: "Контакт", value: options.contact || `${interaction.user}`, inline: false },
      { name: "Цена публикации", value: `${publicationFee} монет`, inline: true }
    )
    .setFooter({ text: `Автор: ${interaction.user.tag}` })
    .setTimestamp();

  if (options.image) {
    embed.setImage(options.image.url);
  }

  return embed;
}

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(token);
  const route = guildId
    ? Routes.applicationGuildCommands(clientId, guildId)
    : Routes.applicationCommands(clientId);

  await rest.put(route, { body: commands });
}

function msToHoursText(ms) {
  const minutes = Math.ceil(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (hours <= 0) {
    return `${minutes} мин`;
  }

  if (restMinutes === 0) {
    return `${hours} ч`;
  }

  return `${hours} ч ${restMinutes} мин`;
}

client.once("ready", async () => {
  await registerCommands();
  console.log(`Bot is ready as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId !== "verify_me") {
        return;
      }

      const state = readState();
      const guildState = getGuildState(state, interaction.guildId, listingFee);
      const verifiedRoleId = guildState.roles.verified;

      if (!verifiedRoleId) {
        await interaction.reply({ content: "Роль Verified ещё не была создана.", ephemeral: true });
        return;
      }

      if (interaction.member.roles.cache.has(verifiedRoleId)) {
        await interaction.reply({ content: "У тебя уже есть верификация.", ephemeral: true });
        return;
      }

      await interaction.member.roles.add(verifiedRoleId, "User completed verification");
      await interaction.reply({ content: "Верификация пройдена. Теперь можешь выбрать роли.", ephemeral: true });
      return;
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId !== "role_picker") {
        return;
      }

      const state = readState();
      const guildState = getGuildState(state, interaction.guildId, listingFee);
      const verifiedRoleId = guildState.roles.verified;

      if (!interaction.member.roles.cache.has(verifiedRoleId)) {
        await interaction.reply({ content: "Сначала пройди верификацию.", ephemeral: true });
        return;
      }

      const roleKeys = ROLE_SELECT_OPTIONS.map((option) => option.value);
      const selectedRoleIds = interaction.values
        .map((key) => guildState.roles[key])
        .filter(Boolean);
      const allManagedRoleIds = roleKeys
        .map((key) => guildState.roles[key])
        .filter(Boolean);

      const rolesToRemove = allManagedRoleIds.filter((id) => !selectedRoleIds.includes(id));

      if (rolesToRemove.length > 0) {
        await interaction.member.roles.remove(rolesToRemove, "Refreshing self-selected roles");
      }

      if (selectedRoleIds.length > 0) {
        await interaction.member.roles.add(selectedRoleIds, "User selected self roles");
      }

      await interaction.reply({ content: "Роли обновлены.", ephemeral: true });
      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }

    const state = readState();
    const guildState = getGuildState(state, interaction.guildId, listingFee);

    if (interaction.commandName === "setup_server") {
      if (!interaction.inGuild()) {
        await interaction.reply({ content: "Эту команду нужно запускать внутри сервера.", ephemeral: true });
        return;
      }

      if (guildState.setupCompleted) {
        await interaction.reply({
          content: "Сервер уже был настроен этим ботом один раз. Повторный запуск заблокирован специально.",
          ephemeral: true
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      const owner = await interaction.guild.fetchOwner();
      const roleIds = await ensureRoles(interaction.guild, owner);
      const channelIds = await ensureChannels(interaction.guild, roleIds);

      guildState.roles = roleIds;
      guildState.channels = channelIds;
      guildState.setupCompleted = true;
      guildState.createdAt = new Date().toISOString();
      writeState(state);

      await postPanels(interaction.guild, channelIds, roleIds, guildState.listingFee);

      await interaction.editReply(
        "Готово. Серверная структура создана, каналы сделаны приватными, панели верификации и ролей отправлены в закрытые каналы."
      );
      return;
    }

    if (interaction.commandName === "daily") {
      const userState = getUserState(state, interaction.guildId, interaction.user.id);
      const now = Date.now();
      const lastDaily = userState.lastDailyAt ? new Date(userState.lastDailyAt).getTime() : 0;
      const cooldown = 24 * 60 * 60 * 1000;

      if (now - lastDaily < cooldown) {
        await interaction.reply({
          content: `Ежедневная награда ещё на перезарядке. Осталось: ${msToHoursText(cooldown - (now - lastDaily))}.`,
          ephemeral: true
        });
        return;
      }

      const reward = 30;
      userState.coins += reward;
      userState.lastDailyAt = new Date(now).toISOString();
      writeState(state);

      await interaction.reply({
        content: `Ты получил ${reward} монет. Текущий баланс: ${userState.coins} монет.`,
        ephemeral: true
      });
      return;
    }

    if (interaction.commandName === "balance") {
      const targetUser = interaction.options.getUser("user") || interaction.user;
      const userState = getUserState(state, interaction.guildId, targetUser.id);

      await interaction.reply({
        content: `${targetUser} сейчас имеет ${userState.coins} монет.`,
        ephemeral: true
      });
      return;
    }

    if (interaction.commandName === "grant_coins") {
      const targetUser = interaction.options.getUser("user", true);
      const amount = interaction.options.getInteger("amount", true);
      const userState = getUserState(state, interaction.guildId, targetUser.id);

      userState.coins += amount;
      writeState(state);

      await interaction.reply({
        content: `${targetUser} получил ${amount} монет. Новый баланс: ${userState.coins}.`,
        ephemeral: true
      });
      return;
    }

    if (interaction.commandName === "post_listing") {
      if (!guildState.setupCompleted) {
        await interaction.reply({
          content: "Сначала запусти `/setup_server`, чтобы бот создал нужные каналы.",
          ephemeral: true
        });
        return;
      }

      const userState = getUserState(state, interaction.guildId, interaction.user.id);
      const fee = guildState.listingFee;

      if (userState.coins < fee) {
        await interaction.reply({
          content: `Недостаточно монет для публикации. Нужно ${fee}, у тебя сейчас ${userState.coins}.`,
          ephemeral: true
        });
        return;
      }

      const type = interaction.options.getString("type", true);
      const title = interaction.options.getString("title", true);
      const description = interaction.options.getString("description", true);
      const budget = interaction.options.getInteger("budget", true);
      const payment = interaction.options.getString("payment", true);
      const image = interaction.options.getAttachment("image");
      const contact = interaction.options.getString("contact");

      const channelId = guildState.channels[getListingChannelKey(type)];
      const targetChannel = interaction.guild.channels.cache.get(channelId);

      if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
        await interaction.reply({
          content: "Канал для публикации не найден. Проверь, что `/setup_server` отработал без ошибок.",
          ephemeral: true
        });
        return;
      }

      userState.coins -= fee;
      writeState(state);

      const embed = createListingEmbed(
        interaction,
        { type, title, description, budget, payment, image, contact },
        fee
      );

      await targetChannel.send({ embeds: [embed] });

      await interaction.reply({
        content: `Объявление опубликовано в ${targetChannel}. Списано ${fee} монет. Остаток: ${userState.coins}.`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error(error);

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: "Произошла ошибка. Проверь права бота и позицию его роли.",
        ephemeral: true
      }).catch(() => null);
      return;
    }

    await interaction.reply({
      content: "Произошла ошибка. Проверь права бота и позицию его роли.",
      ephemeral: true
    }).catch(() => null);
  }
});

client.login(token);

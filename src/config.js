const { ChannelType, PermissionFlagsBits } = require("discord.js");

const ROLE_DEFINITIONS = [
  { key: "founder", name: "Founder", color: 0xf59e0b, hoist: true },
  { key: "coreTeam", name: "Core Team", color: 0xef4444, hoist: true },
  { key: "verified", name: "Verified", color: 0x22c55e, hoist: true },
  { key: "recruiter", name: "Recruiter", color: 0x0ea5e9, hoist: true },
  { key: "scripter", name: "Scripter", color: 0x3b82f6, hoist: true },
  { key: "builder", name: "Builder", color: 0xf97316, hoist: true },
  { key: "uiux", name: "UI/UX", color: 0xec4899, hoist: true },
  { key: "modeler", name: "Modeler", color: 0x8b5cf6, hoist: true },
  { key: "animator", name: "Animator", color: 0x14b8a6, hoist: true },
  { key: "composer", name: "Composer", color: 0x84cc16, hoist: true }
];

const ROLE_SELECT_OPTIONS = [
  { label: "Scripter", value: "scripter", description: "Luau, systems, gameplay logic" },
  { label: "Builder", value: "builder", description: "Maps, environments, level design" },
  { label: "UI/UX", value: "uiux", description: "Interfaces, HUD, product design" },
  { label: "Modeler", value: "modeler", description: "3D models, props, optimization" },
  { label: "Animator", value: "animator", description: "Animation, rigs, polish" },
  { label: "Composer", value: "composer", description: "Music, sound, audio atmosphere" },
  { label: "Recruiter", value: "recruiter", description: "Hiring, team building, production" }
];

function baseOverwrites(guild, extraAllowedRoleIds = []) {
  const allowed = extraAllowedRoleIds.flatMap((id) => (id ? [{
    id,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak
    ]
  }] : []));

  return [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    ...allowed
  ];
}

function buildServerTemplate(guild, roleIds) {
  const privateAccess = [roleIds.founder, roleIds.coreTeam];

  return [
    {
      key: "startHereCategory",
      name: "START HERE",
      type: ChannelType.GuildCategory,
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "ownerControl",
      name: "owner-control",
      type: ChannelType.GuildText,
      parentKey: "startHereCategory",
      topic: "Private channel where setup notes and status are posted.",
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "setupChecklist",
      name: "setup-checklist",
      type: ChannelType.GuildText,
      parentKey: "startHereCategory",
      topic: "Private checklist before you open the server to members.",
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "welcomeInfo",
      name: "welcome-info",
      type: ChannelType.GuildText,
      parentKey: "startHereCategory",
      topic: "Server introduction, rules, and launch notes.",
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "communityCategory",
      name: "COMMUNITY",
      type: ChannelType.GuildCategory,
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "verification",
      name: "verification",
      type: ChannelType.GuildText,
      parentKey: "communityCategory",
      topic: "Verification panel. Open this channel to everyone when you are ready.",
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "chooseRoles",
      name: "choose-roles",
      type: ChannelType.GuildText,
      parentKey: "communityCategory",
      topic: "Role picker panel. Open this channel to everyone when you are ready.",
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "announcements",
      name: "announcements",
      type: ChannelType.GuildText,
      parentKey: "communityCategory",
      topic: "News, updates, and important server announcements.",
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "marketplaceCategory",
      name: "RO CREATE HUB",
      type: ChannelType.GuildCategory,
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "portfolioShowcase",
      name: "portfolio-showcase",
      type: ChannelType.GuildText,
      parentKey: "marketplaceCategory",
      topic: "Show your work, screenshots, trailers, and case studies.",
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "devSearch",
      name: "developer-search",
      type: ChannelType.GuildText,
      parentKey: "marketplaceCategory",
      topic: "Paid posts for finding developers. Uses the bot listing command.",
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "resumes",
      name: "resumes",
      type: ChannelType.GuildText,
      parentKey: "marketplaceCategory",
      topic: "Paid resume posts for developers looking for work.",
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "coinHelp",
      name: "coins-and-commands",
      type: ChannelType.GuildText,
      parentKey: "marketplaceCategory",
      topic: "Explains coins, daily rewards, and listing commands.",
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "voiceCategory",
      name: "VOICE",
      type: ChannelType.GuildCategory,
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "devLobby",
      name: "dev-lobby",
      type: ChannelType.GuildVoice,
      parentKey: "voiceCategory",
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "projectRoom",
      name: "project-room",
      type: ChannelType.GuildVoice,
      parentKey: "voiceCategory",
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    },
    {
      key: "interviewRoom",
      name: "interview-room",
      type: ChannelType.GuildVoice,
      parentKey: "voiceCategory",
      permissionOverwrites: baseOverwrites(guild, privateAccess)
    }
  ];
}

module.exports = {
  ROLE_DEFINITIONS,
  ROLE_SELECT_OPTIONS,
  buildServerTemplate
};

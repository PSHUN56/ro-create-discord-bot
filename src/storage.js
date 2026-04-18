const fs = require("fs");
const path = require("path");

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "state.json");

const defaultState = {
  guilds: {},
  users: {}
};

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(defaultState, null, 2));
  }
}

function readState() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function writeState(state) {
  ensureDataFile();
  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2));
}

function getGuildState(state, guildId, listingFee) {
  if (!state.guilds[guildId]) {
    state.guilds[guildId] = {
      setupCompleted: false,
      channels: {},
      roles: {},
      listingFee
    };
  }

  if (typeof state.guilds[guildId].listingFee !== "number") {
    state.guilds[guildId].listingFee = listingFee;
  }

  return state.guilds[guildId];
}

function getUserState(state, guildId, userId) {
  if (!state.users[guildId]) {
    state.users[guildId] = {};
  }

  if (!state.users[guildId][userId]) {
    state.users[guildId][userId] = {
      coins: 0,
      lastDailyAt: null
    };
  }

  return state.users[guildId][userId];
}

module.exports = {
  readState,
  writeState,
  getGuildState,
  getUserState
};

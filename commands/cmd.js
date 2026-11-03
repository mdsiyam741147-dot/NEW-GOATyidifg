"use strict";

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const vm = require("vm");
const crypto = require("crypto");

const AUTHOR = "𝆠፝𝐒𝐈𝐘𝐀𝐌-𝐇𝐀𝐒𝐀𝐍";
const VERSION = "1.18";
const COMMAND_DIR = __dirname;
const pendingInstalls = new Map();

function cleanFileName(value) {
  let name = String(value || "").trim();

  if (!name.endsWith(".js")) {
    name += ".js";
  }

  if (!/^[a-zA-Z0-9_-]+\.js$/.test(name)) {
    throw new Error("Invalid command file name. Use letters, numbers, _ or -.");
  }

  return name;
}

function uniqueCommands(bot) {
  return [...new Set(bot.commands.values())];
}

function addCommand(bot, fileName) {
  const safeName = cleanFileName(fileName);
  const filePath = path.join(COMMAND_DIR, safeName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${safeName}`);
  }

  delete require.cache[require.resolve(filePath)];

  const loaded = require(filePath);
  const command = loaded.default || loaded;

  if (!command?.config?.name || typeof command.onStart !== "function") {
    throw new Error("Command must export config.name and onStart().");
  }

  command.location = filePath;

  const aliases = command.config.aliases || [];

  const names = [
    command.config.name,
    ...(Array.isArray(aliases) ? aliases : [aliases])
  ];

  const normalizedNames = names.map(name => String(name).toLowerCase());

  if (new Set(normalizedNames).size !== normalizedNames.length) {
    throw new Error("Duplicate command name/alias in command config.");
  }

  const replacing = new Set();

  for (const [key, value] of bot.commands.entries()) {
    if (
      value.location === filePath ||
      value.config?.name === command.config.name
    ) {
      replacing.add(value);
    }
  }

  for (const key of normalizedNames) {
    const existing = bot.commands.get(key);

    if (existing && !replacing.has(existing)) {
      throw new Error(`Command name/alias already exists: ${key}`);
    }
  }

  for (const [key, value] of bot.commands.entries()) {
    if (replacing.has(value)) {
      bot.commands.delete(key);
    }
  }

  for (const key of normalizedNames) {
    bot.commands.set(key, command);
  }

  return command;
}

function removeCommand(bot, target, keepCurrent = true) {
  const key = String(target || "")
    .toLowerCase()
    .replace(/\.js$/, "");

  let found = null;

  for (const command of uniqueCommands(bot)) {
    const file = path.basename(command.location || "")
      .replace(/\.js$/, "")
      .toLowerCase();

    const name = String(command.config?.name || "").toLowerCase();

    const aliases = command.config?.aliases || [];
    const aliasList = Array.isArray(aliases) ? aliases : [aliases];

    if (
      file === key ||
      name === key ||
      aliasList.some(a => String(a).toLowerCase() === key)
    ) {
      found = command;
      break;
    }
  }

  if (!found) {
    throw new Error(`Loaded command not found: ${target}`);
  }

  if (keepCurrent && found.config.name === "cmd") {
    throw new Error("The cmd command cannot unload itself.");
  }

  for (const [name, command] of bot.commands.entries()) {
    if (command === found) {
      bot.commands.delete(name);
    }
  }

  if (found.location && require.cache[require.resolve(found.location)]) {
    delete require.cache[require.resolve(found.location)];
  }

  return found;
}

function validateSource(source, fileName) {
  if (typeof source !== "string" || !source.trim()) {
    throw new Error("Command source is empty.");
  }

  if (Buffer.byteLength(source, "utf8") > 256 * 1024) {
    throw new Error("Command file is too large (maximum 256 KB).");
  }

  new vm.Script(source, {
    filename: fileName
  });
}

async function downloadSource(url) {
  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Only HTTPS download URLs are accepted.");
  }

  if (parsed.hostname === "github.com") {
    const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/(.+)$/);

    if (match) {
      url = `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}`;
    }
  }

  const response = await axios.get(url, {
    timeout: 20000,
    maxContentLength: 256 * 1024,
    responseType: "text",
    headers: {
      "User-Agent": "RJ-Siyam-Telegram-Bot/1.0"
    }
  });

  return typeof response.data === "string"
    ? response.data
    : String(response.data);
}

async function installSource(bot, fileName, source) {
  validateSource(source, fileName);

  const filePath = path.join(COMMAND_DIR, fileName);
  const existed = fs.existsSync(filePath);

  const oldSource = existed
    ? fs.readFileSync(filePath, "utf8")
    : null;

  try {
    fs.writeFileSync(filePath, source, "utf8");

    const command = addCommand(bot, fileName);

    return {
      command,
      filePath,
      replaced: existed
    };
  } catch (error) {
    if (existed) {
      fs.writeFileSync(filePath, oldSource, "utf8");
    } else if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    try {
      if (existed) {
        addCommand(bot, fileName);
      }
    } catch (_) {}

    throw error;
  }
}

async function editCallback(ctx, text) {
  const message = ctx.callbackQuery?.message;

  if (!message) return;

  try {
    await ctx.bot.api.request("editMessageText", {
      chat_id: message.chat.id,
      message_id: message.message_id,
      text,
      reply_markup: {
        inline_keyboard: []
      }
    });
  } catch {
    await ctx.reply(text);
  }
}

module.exports = {
  config: {
    name: "cmd",
    version: VERSION,
    author: AUTHOR,
    cooldown: 5,
    role: 2,
    description: "Manage Telegram bot command files",
    category: "admin",
    guide: "cmd load <file> | loadAll | unload <file> | unloadAll | install <https-url> <file.js> | install <file.js> <code>"
  },

  onStart: async function ({ ctx, bot, args }) {
    const action = String(args[0] || "").toLowerCase();

    try {
      if (action === "load" && args[1]) {
        const command = addCommand(bot, args[1]);

        return ctx.reply(
          `✅ Command "${command.config.name}" loaded successfully.`
        );
      }

      if (
        ["loadall", "load-all"].includes(action) ||
        (action === "load" && args.length > 2)
      ) {
        const names = action === "load"
          ? args.slice(1)
          : fs.readdirSync(COMMAND_DIR)
              .filter(file => file.endsWith(".js"))
              .map(file => file.slice(0, -3));

        const success = [];
        const failed = [];

        for (const name of names) {
          try {
            const command = addCommand(bot, name);
            success.push(command.config.name);
          } catch (error) {
            failed.push(`${name}: ${error.message}`);
          }
        }

        return ctx.reply(
          `✅ Loaded: ${success.length}\n` +
          `${success.map(x => `• ${x}`).join("\n") || "—"}\n\n` +
          `❌ Failed: ${failed.length}\n` +
          `${failed.join("\n") || "—"}`
        );
      }

      if (action === "unload" && args[1]) {
        const command = removeCommand(bot, args[1]);

        return ctx.reply(
          `✅ Command "${command.config.name}" unloaded.`
        );
      }

      if (["unloadall", "unload-all"].includes(action)) {
        let count = 0;

        for (const command of uniqueCommands(bot)) {
          if (command.config?.name === "cmd") continue;

          for (const [key, value] of bot.commands.entries()) {
            if (value === command) {
              bot.commands.delete(key);
            }
          }

          if (command.location) {
            try {
              delete require.cache[require.resolve(command.location)];
            } catch (_) {}
          }

          count++;
        }

        return ctx.reply(
          `✅ Successfully unloaded ${count} commands. Files were not deleted.`
        );
      }

      if (action === "install") {
        if (args.length < 3) {
          return ctx.reply(
            "Usage:\n" +
            "• cmd install <https-url> <file.js>\n" +
            "• cmd install <file.js> <JavaScript code>"
          );
        }

        let fileName;
        let source;

        if (/^https:\/\//i.test(args[1])) {
          fileName = cleanFileName(args[2]);
          source = await downloadSource(args[1]);
        } else {
          const first = args[1];
          const last = args[args.length - 1];

          if (String(last).endsWith(".js")) {
            fileName = cleanFileName(last);

            const marker = last;
            const position = ctx.text.lastIndexOf(marker);

            source = ctx.text
              .slice(0, position)
              .replace(/^.*?\binstall\b/i, "")
              .trim();
          } else {
            fileName = cleanFileName(first);

            const position = ctx.text.indexOf(first);

            source = ctx.text
              .slice(position + first.length)
              .trim();
          }
        }

        validateSource(source, fileName);

        const target = path.join(COMMAND_DIR, fileName);

        if (fs.existsSync(target)) {
          const id = crypto.randomBytes(5).toString("hex");

          pendingInstalls.set(id, {
            userId: String(ctx.userId),
            fileName,
            source
          });

          return ctx.reply(
            `⚠️ "${fileName}" already exists.\nDo you want to replace it?`,
            {
              reply_markup: {
                inline_keyboard: [[
                  {
                    text: "✅ Confirm overwrite",
                    callback_data: `cmd:yes:${id}`
                  },
                  {
                    text: "❌ Cancel",
                    callback_data: `cmd:no:${id}`
                  }
                ]]
              }
            }
          );
        }

        const result = await installSource(bot, fileName, source);

        return ctx.reply(
          `✅ Installed and loaded "${result.command.config.name}" (${fileName}).`
        );
      }

      return ctx.reply(
        "📘 CMD MANAGER\n\n" +
        "cmd load <file>\n" +
        "cmd loadAll\n" +
        "cmd unload <file>\n" +
        "cmd unloadAll\n" +
        "cmd install <https-url> <file.js>\n" +
        "cmd install <file.js> <code>"
      );
    } catch (error) {
      console.error("[CMD MANAGER ERROR]", error);

      return ctx.reply(`❌ ${error.message}`);
    }
  },

  onCallback: async function ({ ctx, bot, data }) {
    if (!data?.startsWith("cmd:")) return;

    const [, action, id] = data.split(":");
    const item = pendingInstalls.get(id);

    if (!item) {
      return editCallback(ctx, "⌛ This confirmation has expired.");
    }

    if (String(ctx.userId) !== item.userId) return;

    pendingInstalls.delete(id);

    if (action === "no") {
      return editCallback(ctx, "❎ Installation cancelled.");
    }

    if (action !== "yes") return;

    try {
      const result = await installSource(
        bot,
        item.fileName,
        item.source
      );

      return editCallback(
        ctx,
        `✅ Installed and loaded "${result.command.config.name}".`
      );
    } catch (error) {
      console.error("[CMD INSTALL CALLBACK ERROR]", error);

      return editCallback(
        ctx,
        `❌ Install failed: ${error.message}`
      );
    }
  }
};

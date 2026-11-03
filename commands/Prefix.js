"use strict";

const crypto = require("crypto");

const AUTHOR = "𝐒𝐈𝐘𝐀𝐌-𝐇𝐀𝐒𝐀𝐍";
const VERSION = "3.3";
const pending = new Map();

const mediaList = [
  "https://i.imgur.com/8pT5G8g.gif",
  "https://i.imgur.com/7iqtimo.gif"
];

function bold(value) {
  const map = {
    ...Object.fromEntries("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c, i) => [c, "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙"[i]])),
    ...Object.fromEntries("abcdefghijklmnopqrstuvwxyz".split("").map((c, i) => [c, "𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳"[i]])),
    ...Object.fromEntries("0123456789".split("").map((c, i) => [c, "𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗"[i]]))
  };

  return String(value ?? "").split("").map(c => map[c] || c).join("");
}

function commandCount(bot) {
  return new Set([...bot.commands.values()]).size;
}

function getGroupPrefix(bot, chatId) {
  return bot.database?.get("prefixes", chatId) || bot.config.prefix || ",";
}

function getInfoText(bot, ctx, design) {
  const systemPrefix = bot.config.prefix || ",";
  const groupPrefix = getGroupPrefix(bot, ctx.chatId);

  const now = new Date();

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(now);

  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(now);

  const total = commandCount(bot);

  if (design === 0) {
    return `» 👑 𝐒𝐈𝐘𝐀𝐌-𝐇𝐀𝐒𝐀𝐍 👑
━━━━━━━━━━━━━━━
⚙️ 𝐏𝐑𝐄𝐅𝐈𝐗
╰─➤ ${bold(systemPrefix)}
💬 𝐆𝐑𝐎𝐔𝐏
╰─➤ ${bold(groupPrefix)}
» 🕐 𝐓𝐈𝐌𝐄 › ${bold(time)}
» 📆 𝐃𝐀𝐓𝐄 › ${bold(date)}
» 👑 𝐎𝐖𝐍𝐄𝐑
» ⚛️ ${AUTHOR}
» ⚡ 𝐂𝐌𝐃𝐒 › ${bold(total)}
» ⚛️ 𝐕𝐄𝐑 › 𝐕𝟐 • 𝐕𝟑 • 𝐕𝟓
» ✅ 𝐒𝐓𝐀𝐓𝐔𝐒 › 𝐀𝐂𝐓𝐈𝐕𝐄
━━━━━━━━━━━━━━━
╭─ 🔗 𝐆𝐈𝐓𝐇𝐔𝐁 ─╮
╰➤ https://github.com/mdsiyam741147-dot/NEW-GOATyidifg
━━━━━━━━━━━━━━━
🧚‍♀️ 𝗡𝗜𝗝𝗛𝗨𝗠 𝗖𝗛𝗔𝗧𝗕𝗢𝗧`;
  }

  return `❖ ─ [ 𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐅𝐎 ] ─ ❖

⚡ 𝐏𝐑𝐄𝐅𝐈𝐗 : ➜ [ ${bold(systemPrefix)} ]
💬 𝐆𝐑𝐎𝐔𝐏 : ── ❖ ${bold(groupPrefix)} ❖──
⏰ 𝐓𝐈𝐌𝐄 : ${bold(time)}
📅 𝐃𝐀𝐓𝐄 : ${bold(date)}
👑 𝐎𝐖𝐍𝐄𝐑 :
⚛️ ${AUTHOR}
📊 𝐓𝐎𝐓𝐀🇱 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 : ${bold(total)}
⚛️ 𝐕𝐄𝐑𝐒𝐈𝐎𝐍 : 𝐕𝟐 • 𝐕𝟑 • 𝐕𝟓
✅ 𝐒𝐓𝐀𝐓𝐔𝐒 : 𝐀𝐂𝐓𝐈𝐕𝐄
━━━━━━━━━━━━━━━
╭─ 🔗 𝐆𝐈𝐓𝐇𝐔𝐁 ─╮
╰➤ https://github.com/mdsiyam741147-dot/NEW-GOATyidifg
━━━━━━━━━━━━━━━
⚛️ 𝐍𝐈𝐉𝐇𝐔𝐌 𝐂𝐇𝐀𝐓𝐁𝐎𝐓`;
}

async function showInfo(ctx, bot) {
  const text = getInfoText(bot, ctx, Math.floor(Math.random() * 2));
  const animation = mediaList[Math.floor(Math.random() * mediaList.length)];

  try {
    await bot.api.request("sendAnimation", {
      chat_id: ctx.chatId,
      animation,
      caption: text,
      reply_to_message_id: ctx.messageId || undefined
    });
  } catch (error) {
    await ctx.reply(text);
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
  } catch (error) {
    await ctx.reply(text);
  }
}

module.exports = {
  config: {
    name: "prefix",
    aliases: ["setprefix"],
    version: VERSION,
    author: AUTHOR,
    cooldown: 5,
    role: 0,
    description: "Show or change the global/group command prefix",
    category: "config",
    guide: "prefix | prefix <new-prefix> | prefix reset | prefix <new-prefix> -g"
  },

  onStart: async function ({ ctx, bot, args }) {
    try {
      if (!args.length) return showInfo(ctx, bot);

      const isGlobal = args.includes("-g");
      const isReset = args[0].toLowerCase() === "reset";
      const role = await bot.permissions.getRole(ctx);

      if (isGlobal && role < 2) {
        return ctx.reply("⛔ Global Prefix পরিবর্তন করতে Bot Admin হতে হবে।");
      }

      if (
        !isReset &&
        (
          args[0].length > 5 ||
          /\s/.test(args[0]) ||
          args[0].startsWith("/")
        )
      ) {
        return ctx.reply("❌ Prefix ১-৫ অক্ষরের হতে হবে; space বা / ব্যবহার করা যাবে না।");
      }

      const nextPrefix = isReset
        ? (isGlobal ? (bot.config.defaultPrefix || ",") : (bot.config.prefix || ","))
        : args[0];

      const id = crypto.randomBytes(5).toString("hex");

      pending.set(id, {
        userId: String(ctx.userId),
        chatId: ctx.chatId,
        nextPrefix,
        isGlobal,
        isReset
      });

      const scope = isGlobal ? "GLOBAL" : "এই CHAT/GROUP";
      const action = isReset ? "RESET" : "CHANGE";

      return ctx.reply(
        `⚠️ ${scope} PREFIX ${action} করতে চাও?\nনতুন Prefix: ${nextPrefix}\nনিচের বাটনে চাপ দিয়ে নিশ্চিত করো।`,
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text: "✅ Confirm",
                callback_data: `prefix:yes:${id}`
              },
              {
                text: "❌ Cancel",
                callback_data: `prefix:no:${id}`
              }
            ]]
          }
        }
      );
    } catch (error) {
      console.error("[PREFIX ERROR]", error);
      return ctx.reply(`❌ Prefix Error: ${error.message}`);
    }
  },

  onCallback: async function ({ ctx, bot, data }) {
    if (!data?.startsWith("prefix:")) return;

    const [, action, id] = data.split(":");
    const item = pending.get(id);

    if (!item) {
      return editCallback(ctx, "⌛ এই Confirmation আর কার্যকর নেই।");
    }

    if (String(ctx.userId) !== item.userId) return;

    pending.delete(id);

    if (action === "no") {
      return editCallback(ctx, "❎ Prefix পরিবর্তন বাতিল করা হয়েছে।");
    }

    if (action !== "yes") return;

    try {
      if (item.isGlobal) {
        bot.config.prefix = item.nextPrefix;

        const settings = bot.database.get("global", "settings") || {};

        await bot.database.set("global", "settings", {
          ...settings,
          prefix: item.nextPrefix
        });
      } else if (item.isReset) {
        await bot.database.delete("prefixes", item.chatId);
      } else {
        await bot.database.set("prefixes", item.chatId, item.nextPrefix);
      }

      const actual = item.isReset && !item.isGlobal
        ? (bot.config.prefix || ",")
        : item.nextPrefix;

      return editCallback(
        ctx,
        `✅ Prefix সফলভাবে ${item.isReset ? "Reset" : "Changed"} হয়েছে।\nনতুন Prefix: ${actual}`
      );
    } catch (error) {
      console.error("[PREFIX CALLBACK ERROR]", error);

      return editCallback(
        ctx,
        `❌ Prefix সংরক্ষণ করা যায়নি: ${error.message}`
      );
    }
  }
};

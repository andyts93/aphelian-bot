const { lstatSync, readdirSync } = require("fs");
const { extname, join } = require("path");

module.exports = class Utils {
  static recursiveReadDirSync(dir, allowedExtensions = [".js"]) {
    const filePaths = [];
    
    const readCommands = (dir) => {
      const files = readdirSync(join(process.cwd(), dir));
      files.forEach((file) => {
        const stat = lstatSync(join(process.cwd(), dir, file));
        if (stat.isDirectory()) {
          readCommands(join(dir, file));
        } else {
          const extension = extname(file);
          if (!allowedExtensions.includes(extension)) return;
          const filePath = join(process.cwd(), dir, file);
          filePaths.push(filePath);
        }
      });
    };
    readCommands(dir);
    return filePaths;
  }

  /**
   * 
   * @param {integer} min 
   * @param {integer} max 
   * @returns integer
   */
  static getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 
   * @param {import('discord.js').Guild} guild
   * @param {*} member_id 
   */
  static async retrieveMember(guild, member_id) {
    const member = guild.members.cache.get(member_id) || await guild.members.fetch(member_id);
  }
}
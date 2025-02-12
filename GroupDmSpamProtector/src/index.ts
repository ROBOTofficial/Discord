import { Client, GroupDMChannel } from "discord.js-selfbot-v13";
import { sleep } from "./sleep";
import { database } from "./Database";
import { codeBlock } from "./codeBlock";

type GroupDM = {
    type: 3
    recipients: {
        username: string
        public_flags: number
        id: string
        global_name: string
        discriminator: string
        avatar: string
    }[]
    recipient_flags: number
    owner_id: string
    name: string | null
    last_message_id: string | null
    id: string
    icon: string | null
    flags: number
    blocked_user_warning_dismissed: boolean
}

class Main {
    private readonly client = new Client();
    private readonly token = process.env.TOKEN ?? "";

    private async leaveDM(channelId: string): Promise<boolean> {
        try {
            const response = await fetch(`https://discord.com/api/v9/channels/${channelId}?silent=true`, {
                method: "DELETE",
                headers: {
                    "Authorization": this.token,
                }
            });
            if (response.status === 200) {
                return true;
            }
            if (response.status === 429) {
                await sleep(5 * 1000);
                return await this.leaveDM(channelId);
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    private async includeBlackListUser(userIds: string[]) {
        try {
            const blackListUsers = await database.blacklist.fetchUsers();
            for (const { userId } of blackListUsers) {
                if (userIds.includes(userId)) {
                    return true;
                }
            }
            return false;
        } catch {
            return false;
        }
    }

    private async leaveDMs() {
        try {
            const dms = this.client.channels.cache.filter(value => value.type === "GROUP_DM").values().toArray();
            for (const dm of dms) {
                if (await this.includeBlackListUser(dm.recipients.map(user => user.id))) {
                    await this.leaveDM(dm.id);
                }
            }
        } catch {}
    }

    public async loadEvents() {
        if (!process.env.TOKEN) {
            console.error("TOKEN NOT FOUND");
            return void process.exit(0);
        }
        this.client.on("ready", async () => {
            await this.leaveDMs();
        });
        this.client.ws.on("CHANNEL_CREATE", async (data) => {
            if (data.type === 3) {
                const { recipients, id } = data as GroupDM;
                if (await this.includeBlackListUser(recipients.map(user => user.id))) {
                    await this.leaveDM(id);
                }
            }
        });
        this.client.on("messageCreate", async message => {
            try {
                if (message.channel.type === "GROUP_DM" && await this.includeBlackListUser(message.channel.recipients.map(user => user.id))) {
                    await this.leaveDM(message.channel.id);
                    return;
                }
                if (this.client.user && message.author.id !== this.client.user.id) {
                    return;
                }
                if (message.content.startsWith("r!blacklist")) {
                    const args = message.content.split(" ");
                    const command = args[1];
                    const targetId = args[2];
                    if (!command || !targetId) {
                        return void await message.reply("INVALID COMMAND\n" + codeBlock("r!blacklist <command> <userId>"));
                    }
                    if (command === "add") {
                        if (await database.blacklist.add(targetId)) {
                            await this.leaveDMs();
                            await message.reply(codeBlock(`ADD: ${targetId}`));
                        } else {
                            await message.reply(codeBlock("DATABASE_ERROR"));
                        }
                    }
                    if (command === "remove") {
                        if (await database.blacklist.remove(targetId)) {
                            await message.reply(codeBlock(`REMOVE: ${targetId}`));
                        } else {
                            await message.reply(codeBlock("DATABASE_ERROR"));
                        }
                    }
                }
            } catch {}
        });
    }

    public async login() {
        await this.client.login(this.token);
    }
}

const main = new Main();
await main.loadEvents();
await main.login();

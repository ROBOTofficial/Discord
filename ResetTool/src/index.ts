import { Client } from "discord.js-selfbot-v13";

class Main {
    private readonly client = new Client();
    private readonly token = process.env.TOKEN ?? "";

    public async loadEvents() {
        if (!process.env.TOKEN) {
            console.error("TOKEN NOT FOUND");
            return void process.exit(0);
        }
        this.client.on("ready", async (client) => {
            for (const channel of client.channels.cache.values()) {
                try {
                    if (channel.isText() || channel.isVoice() || channel.isThread()) {
                        let before: string | undefined = undefined;
                        for (;;) {
                            const messages = (await channel.messages.fetch({ limit: 100, before })).values().toArray();
                            if (!messages.length) {
                                break
                            }
                            console.log(`FIND_CHANNEL: ${channel.id}`);
                            for (const message of messages) {
                                if (message.author.id === client.user.id) {
                                    try {
                                        await message.delete();
                                        console.log(`DELETED_MESSAGE: ${message.id}`);
                                    } catch {}
                                }
                                before = message.id;
                            }
                        }
                    }
                } catch {}
            }
            console.log("COMPLETED");
            process.exit(0);
        });
    }

    public async login() {
        await this.client.login(this.token);
    }
}

const main = new Main();
await main.loadEvents();
await main.login();

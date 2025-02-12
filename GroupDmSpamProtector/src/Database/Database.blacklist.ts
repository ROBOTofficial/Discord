import type { Prisma } from "@prisma/client";
import type { DefaultArgs } from "@prisma/client/runtime/library";

export class Blacklist {
    constructor(private readonly table: Prisma.BlackListDelegate<DefaultArgs>) {}

    public async isInBlacklist(userId: string) {
        try {
            return Boolean(await this.table.findFirst({ where: { userId } }));
        } catch {
            return false;
        }
    }

    public async fetchUsers() {
        try {
            return await this.table.findMany();
        } catch {
            return [];
        }
    }

    public async add(userId: string) {
        try {
            const element = await this.table.findFirst({ where: { userId } });
            if (!element) {
                await this.table.create({ data: { userId } });
            }
            return true;
        } catch {
            return false;
        }
    }

    public async remove(userId: string) {
        try {
            return await this.table.deleteMany({ where: { userId } });
        } catch {
            return null;
        }
    }
}

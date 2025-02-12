import { PrismaClient } from "@prisma/client";

import { Blacklist } from "./Database.blacklist";

export class Database {
    public readonly blacklist = new Blacklist(prisma.blackList);
}

export const prisma = new PrismaClient();
export const database = new Database();

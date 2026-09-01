/* eslint-disable @typescript-eslint/no-require-imports -- Prisma seed runs as plain Node in Docker */
const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_AUTHOR_EMAIL ?? 'author@zz.blog';
  const username = process.env.SEED_AUTHOR_USERNAME ?? 'author';
  const password = process.env.SEED_AUTHOR_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMIN, username, nickname: username },
    create: {
      email,
      username,
      nickname: username,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`已 seed 作者: ${username} (${email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

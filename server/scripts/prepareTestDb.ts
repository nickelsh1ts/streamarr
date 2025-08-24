import { UserType } from '@server/constants/user';
import dataSource, { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { copyFileSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const prepareDb = async () => {
  // Copy over test settings.json
  copyFileSync(
    path.join(__dirname, '../../cypress/config/settings.cypress.json'),
    path.join(__dirname, '../../config/settings.json')
  );

  // Connect to DB and seed test data
  const dbConnection = await dataSource.initialize();

  if (process.env.PRESERVE_DB !== 'true') {
    await dbConnection.dropDatabase();
  }

  // Run migrations in production
  if (process.env.WITH_MIGRATIONS === 'true') {
    await dbConnection.runMigrations();
  } else {
    await dbConnection.synchronize();
  }

  const userRepository = getRepository(User);

  const admin = await userRepository.findOne({
    select: { id: true, plexId: true },
    where: { id: 1 },
  });

  // Create the admin user
  const user =
    (await userRepository.findOne({
      where: { email: 'admin@streamarr.dev' },
    })) ?? new User();
  user.plexId = admin?.plexId ?? 1;
  user.plexToken = '1234';
  user.plexUsername = 'admin';
  user.username = 'admin';
  user.email = 'admin@streamarr.dev';
  user.userType = UserType.PLEX;
  await user.setPassword('test1234');
  user.permissions = 2;
  user.avatar = `https://www.gravatar.com/avatar/${crypto.createHash('md5').update('admin@streamarr.dev'.trim().toLowerCase()).digest('hex')}?d=mm&s=200`;
  await userRepository.save(user);

  // Create the other user
  const otherUser =
    (await userRepository.findOne({
      where: { email: 'friend@streamarr.dev' },
    })) ?? new User();
  otherUser.plexId = admin?.plexId ?? 1;
  otherUser.plexToken = '1234';
  otherUser.plexUsername = 'friend';
  otherUser.username = 'friend';
  otherUser.email = 'friend@streamarr.dev';
  otherUser.userType = UserType.PLEX;
  await otherUser.setPassword('test1234');
  otherUser.permissions = 32;
  otherUser.avatar = `https://www.gravatar.com/avatar/${crypto.createHash('md5').update('friend@streamarr.dev'.trim().toLowerCase()).digest('hex')}?d=mm&s=200`;
  await userRepository.save(otherUser);
};

prepareDb();

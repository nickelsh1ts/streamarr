import 'reflect-metadata';
import type { DataSourceOptions, EntityTarget, Repository } from 'typeorm';
import { DataSource } from 'typeorm';

const createDataSourceOptions = (): DataSourceOptions => {
  const dbType: string = process.env.DB_TYPE ?? 'sqlite';
  const isProd: boolean = process.env.NODE_ENV === 'production';

  const shared: Partial<DataSourceOptions> = {
    entities: isProd ? ['dist/entity/**/*.js'] : ['server/entity/**/*.ts'],
    migrations: isProd
      ? ['dist/migration/**/*.js']
      : ['server/migration/**/*.ts'],
    subscribers: isProd
      ? ['dist/subscriber/**/*.js']
      : ['server/subscriber/**/*.ts'],
    logging: false,
    migrationsRun: false,
  };

  if (dbType === 'postgres') {
    const envVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

    for (const v of envVars) {
      if (!process.env[v]) {
        throw new Error(
          `Environment variable ${v} must be set for using a Postgres db configuration`
        );
      }
    }

    const postgresConfig: DataSourceOptions = {
      type: 'postgres',
      host: process.env.DB_HOST!,
      port: Number(process.env.DB_PORT)!,
      username: process.env.DB_USERNAME!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
      synchronize: false,
    };

    return { ...shared, ...postgresConfig } as DataSourceOptions;
  }

  const sqliteConfig: DataSourceOptions = {
    type: 'sqlite',
    database: process.env.CONFIG_DIRECTORY
      ? `${process.env.CONFIG_DIRECTORY}/db/db.sqlite3`
      : 'config/db/db.sqlite3',
    synchronize: false,
    enableWAL: true,
  };

  return { ...shared, ...sqliteConfig } as DataSourceOptions;
};

const dataSource = new DataSource(createDataSourceOptions());

export const getRepository = <Entity extends object>(
  target: EntityTarget<Entity>
): Repository<Entity> => {
  return dataSource.getRepository(target);
};

export default dataSource;

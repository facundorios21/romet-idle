import { Module } from '@nestjs/common';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './use-cases/auth/auth.module';
import { UsersModule } from './use-cases/users/users.module';
import { PacksModule } from './use-cases/packs/packs.module';
import { CollectionModule } from './use-cases/collection/collection.module';
import { AdminModule } from './use-cases/admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    PacksModule,
    CollectionModule,
    AdminModule,
  ],
})
export class AppModule {}


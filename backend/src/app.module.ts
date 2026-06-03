import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UserEntity } from './infrastructure/typeorm/entities/user.entity';
import { CardEntity } from './infrastructure/typeorm/entities/card.entity';
import { UserCardEntity } from './infrastructure/typeorm/entities/user-card.entity';
import { PackEntity } from './infrastructure/typeorm/entities/pack.entity';
import { ElementEntity } from './infrastructure/typeorm/entities/element.entity';
import { RarityEntity } from './infrastructure/typeorm/entities/rarity.entity';
import { SetEntity } from './infrastructure/typeorm/entities/set.entity';
import { AuthModule } from './use-cases/auth/auth.module';
import { UsersModule } from './use-cases/users/users.module';
import { PacksModule } from './use-cases/packs/packs.module';
import { CollectionModule } from './use-cases/collection/collection.module';
import { AdminModule } from './use-cases/admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [UserEntity, CardEntity, UserCardEntity, PackEntity, ElementEntity, RarityEntity, SetEntity],
      synchronize: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 120, // max 120 requests per minute
    }]),
    AuthModule,
    UsersModule,
    PacksModule,
    CollectionModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}



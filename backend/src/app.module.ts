import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from '../lib/auth';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { CompaniesModule } from './companies/companies.module';
import { ItemsModule } from './items/items.module';
import { SnapshotsModule } from './snapshots/snapshots.module';
import { SalesCardsModule } from './sales-cards/sales-cards.module';
import { StockModule } from './stock/stock.module';
import { KpisModule } from './kpis/kpis.module';
import { RestocksModule } from './restocks/restocks.module';
import { ChartsModule } from './charts/charts.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 300,
      },
    ]),
    AuthModule.forRoot({ auth }),
    PrismaModule,
    UserModule,
    CompaniesModule,
    ItemsModule,
    SnapshotsModule,
    SalesCardsModule,
    StockModule,
    KpisModule,
    ChartsModule,
    RestocksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

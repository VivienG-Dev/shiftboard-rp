import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from '../lib/auth';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { CompaniesModule } from './companies/companies.module';
import { ItemsModule } from './items/items.module';
import { SnapshotsModule } from './snapshots/snapshots.module';
import { SalesCardsModule } from './sales-cards/sales-cards.module';

@Module({
  imports: [
    AuthModule.forRoot({ auth }),
    PrismaModule,
    UserModule,
    CompaniesModule,
    ItemsModule,
    SnapshotsModule,
    SalesCardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

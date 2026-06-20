import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/users/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env.development",".env.production"],
      isGlobal: true
    }),
    UserModule,
    MongooseModule.forRoot(process.env.DB_URI!, {
      onConnectionCreate: (connection: Connection) => {
        connection.on('connected', () =>
          console.log('DB connected successfully ✅'),
        );
        return connection;
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

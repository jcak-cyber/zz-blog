import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ReactionsController],
  providers: [ReactionsService],
})
export class ReactionsModule {}

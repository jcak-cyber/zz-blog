import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}

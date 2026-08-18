import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async findByClerkUserId(clerkUserId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ clerkUserId, status: 'active' }).exec();
  }

  async syncFromClerk(data: {
    clerkUserId: string;
    email: string | null;
    fullName: string;
    avatarUrl?: string | null;
  }): Promise<UserDocument> {
    return this.userModel
      .findOneAndUpdate(
        { clerkUserId: data.clerkUserId },
        {
          $set: {
            email: data.email,
            fullName: data.fullName,
            avatarUrl: data.avatarUrl ?? null,
            status: 'active',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}

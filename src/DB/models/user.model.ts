import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { GenderEnum, RoleEnum } from 'src/common/enum/user.enum';
import { Encrypt } from 'src/common/security/encrypt.security';
import { Hash } from 'src/common/security/hash.security';

@Schema({
    timestamps: true,
    strictQuery: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})
export class User {
  @Prop({type: String, required: true, trim: true, minLength:2,maxLength:30})
  userName: string;

  @Prop({type: String, required: true, trim: true, unique: true})
  email: string;

  @Prop({type: String})
  password: string;

  @Prop({type: String, trim: true})
  address?: string;

  @Prop({type: String, trim: true, minLength: 11})
  phone?: string;

  @Prop({type: Number, required: true })
  age: number;

  @Prop({type: Boolean })
  confirmed: boolean;

  @Prop({type: Date})
  changeCredential: Date;

  @Prop({type: String, enum: GenderEnum, default: GenderEnum.male})
  gender?: GenderEnum;

  @Prop({type: String, enum: RoleEnum, default: RoleEnum.user})
  role?: RoleEnum;

  @Prop({type: String})
  profilePic?: string;
}

export const userSchema = SchemaFactory.createForClass(User);
userSchema.pre("save", function(){
  if(this.isModified("password")){
    this.password = Hash({plain_text: this.password})
  }
})

export type HUserDocument = HydratedDocument<User>;

export const userModel = MongooseModule.forFeature([{ name: User.name, schema: userSchema }])

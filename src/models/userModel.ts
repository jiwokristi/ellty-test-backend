import bcrypt from 'bcryptjs';
import { Document, InferSchemaType, model, Schema } from 'mongoose';

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username!'],
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password!'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password!'],
    validate: {
      validator: function (val: string) {
        return val === this.password;
      },
      message: "Passwords don't match!",
    },
  },
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);

  (this as any).passwordConfirm = undefined;
});

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export type UserData = InferSchemaType<typeof userSchema>;
export interface IUser extends Document, UserData {
  correctPassword(
    candidatePassword: string,
    userPassword: string,
  ): Promise<boolean>;
}

const User = model<IUser>('User', userSchema);

export default User;

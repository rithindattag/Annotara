import bcrypt from 'bcryptjs';
import { Schema, model } from 'mongoose';

export type UserRole = 'Annotator' | 'Reviewer' | 'Admin';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['Annotator', 'Reviewer', 'Admin'],
      default: 'Annotator'
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password: string) {
  return bcrypt.compare(password, this.password);
};

export const UserModel = model<IUser>('User', userSchema);

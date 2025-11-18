import bcrypt from 'bcryptjs';

export const hashPassword = async (plain) => bcrypt.hash(plain, 10);

export const comparePassword = async (plain, hash) => {
  if (typeof plain !== 'string' || typeof hash !== 'string') return false;
  return bcrypt.compare(plain, hash);
};

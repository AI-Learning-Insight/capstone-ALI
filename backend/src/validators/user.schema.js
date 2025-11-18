import Joi from 'joi';

// Skema utama untuk PATCH /me
export const updateProfileSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  phone: Joi.string().trim().allow('', null),
  dob: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('', null), // yyyy-mm-dd
  address: Joi.string().allow('', null),
  bio: Joi.string().allow('', null),
  avatar_url: Joi.string().uri({ allowRelative: true }).allow('', null),
  grade: Joi.string().max(20).allow('', null),
  school_id: Joi.string().max(50).allow('', null),
}).min(1);

// Alias untuk kompatibilitas lama
export const profileUpdateSchema = updateProfileSchema;

export const changePasswordSchema = Joi.object({
  password_current: Joi.string().required(),
  password_new: Joi.string().min(8).max(128).required(),
  // opsional dari FE; kalau ada harus sama
  password_confirm: Joi.any().valid(Joi.ref('password_new')).messages({
    'any.only': 'Konfirmasi password baru tidak cocok',
  }).optional(),
}).unknown(true); // terima field lain tanpa error

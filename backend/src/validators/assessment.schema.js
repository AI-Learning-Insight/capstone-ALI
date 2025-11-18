import Joi from 'joi';

export const assessmentCreateSchema = Joi.object({
  scores: Joi.object({
    math: Joi.number().min(0).max(100).required(),
    biology: Joi.number().min(0).max(100).required(),
    history: Joi.number().min(0).max(100).required(),
    economics: Joi.number().min(0).max(100).required()
  }).required(),
  psych: Joi.object({
    openness: Joi.number().min(1).max(5).required(),
    conscientiousness: Joi.number().min(1).max(5).required(),
    analytical: Joi.number().min(1).max(5).required()
  }).required(),
  learning_style: Joi.string().valid('fast', 'consistent', 'reflective').required()
});

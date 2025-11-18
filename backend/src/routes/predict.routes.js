import { predict } from '../controllers/predict.controller.js';

export default [{ method: 'POST', path: '/predict', handler: predict }];

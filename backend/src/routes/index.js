import health from './health.routes.js';
import auth from './auth.routes.js';
import me from './me.routes.js';
import assessment from './assessment.routes.js';
import todo from './todo.routes.js';
import dashboard from './dashboard.routes.js';
import predict from './predict.routes.js';
import ml from './ml.routes.js';
import mentorRoutes from './mentor.routes.js';

export default [
  ...health,
  ...auth,
  ...me,
  ...assessment,
  ...todo,
  ...dashboard,
  ...predict,
  ...ml,
  ...mentorRoutes,
];

import cors from 'cors';

const devCorsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200
};

const prodCorsOptions = {
  origin: [    
    'http://localhost:5173', // Local frontend for development
    /http:\/\/localhost:\d+/, // Allow localhost with any port
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Origin', 'X-Requested-With', 'Accept', 'x-client-key', 'x-client-token', 'x-client-secret', 'Authorization'],
  //allowedHeaders: ['Content-Type', 'Authorization', 'x-client-key', 'x-client-token', 'x-client-secret'],
  credentials: true,
  optionsSuccessStatus: 200
};

const corsOptions = process.env.NODE_ENV === 'development' ? devCorsOptions : prodCorsOptions;

export default cors(corsOptions);

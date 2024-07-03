import Server from './classes/server';
import router from './routes/router';
import express from 'express';
import cors from 'cors';
import schedule from 'node-schedule';
import { evaluateUrl } from './controllers/biFrontController';
// import biE2E from './controllers/biFrontController';

const server = new Server();
const { app } = server;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

server.start(() => {
  console.log(`Server running on port http://localhost:${server.port}`);
});

app.get('/example', (req, res) => {
  res.send('Hola Mundo');
});

app.use('/', router);

const executeBiFrontEndpoint = async () => {
  // await biE2E();
  const response = await evaluateUrl(
    'https://bitest.ciat.cgiar.org/bi/cgiar-results-dashboard/monitor'
  );
  console.log(response);
  console.log('job');
};

schedule.scheduleJob('*/10 * * * *', executeBiFrontEndpoint);

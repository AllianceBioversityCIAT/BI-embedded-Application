import Server from './classes/server';
import router from './routes/router';
import express from 'express';
import cors from 'cors';
import schedule from 'node-schedule';
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
  console.log('job');
};

schedule.scheduleJob('*/1 * * * *', executeBiFrontEndpoint);

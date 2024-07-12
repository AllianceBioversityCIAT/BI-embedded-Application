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

const websites = [
  {
    link: 'https://bitest.ciat.cgiar.org/bi/cgiar-results-dashboard/monitor',
    spec: '*/5 * * * * *',
    cssClass: 'zero'
  },
  {
    link: 'https://bitest.ciat.cgiar.org/bi/cgiar-results-dashboard/monitor',
    spec: '*/10 * * * * *',
    cssClass: 'one'
  },
  {
    link: 'https://bitest.ciat.cgiar.org/bi/cgiar-results-dashboard/monitor',
    spec: '*/20 * * * * *',
    cssClass: 'one'
  },
  {
    link: 'https://bitest.ciat.cgiar.org/bi/cgiar-results-dashboard/monitor',
    spec: '*/30 * * * * *',
    cssClass: 'three'
  },
  {
    link: 'https://bitest.ciat.cgiar.org/bi/cgiar-results-dashboard/monitor',
    spec: '*/60 * * * * *',
    cssClass: 'four'
  }
];
console.log('foreach');

for (let index = 0; index < websites.length; index++) {
  console.log('start');
  const { link, spec, cssClass } = websites[index];
  schedule.scheduleJob(spec, async () => {
    try {
      const response = await evaluateUrl(link);
      console.log('init => ' + spec + ' => ' + cssClass);
      console.log(response);
    } catch (error) {
      console.error('Error al evaluar la URL:', link, error);
      // Aquí puedes decidir cómo manejar el error, por ejemplo, reintentar, registrar el error, etc.
    }
  });
}

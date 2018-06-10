//Using webpack and babel allows us to use ES2015 import statements
import 'babel-polyfill';
import express from 'express';
import { matchRoutes } from 'react-router-config';
import proxy from 'express-http-proxy';
import Routes from './client/Routes';
import renderer from './helpers/renderer';
import createStore from './helpers/createStore';
const app = express();

//sets up the http-proxy
//any reaust for route starting with /api will get forwarded to the api
//The last argument, the option object, will not need to be used on personal apps, only for this api being used in this example, happens to do with google oauth flow issues
app.use(
  '/api',
  proxy('http://react-ssr-api.herokuapp.com', {
    proxyReqOptDecorator(opts) {
      opts.headers['x-forwarded-host'] = 'localhost:3000';
      return opts;
    }
  })
);

//make the public directory available to anyone requesting it
app.use(express.static('public'));

//accepts any path request, lets react router handle the decision making
app.get('*', (req, res) => {
  const store = createStore(req);

  //looks at routes array, looks at req.path and returns an array of components that are going to be rendered
  //checks to see if there is a loadData function assocaited with the component that needs to be rendered, if so, it is invoked, those functions return promises represnting the underliying http requests for data, we then store the array of those promises returned from the map function in the promises constant
  const promises = matchRoutes(Routes, req.path)
    .map(({ route }) => {
      return route.loadData ? route.loadData(store) : null;
    })
    .map(promise => {
      if (promise) {
        return new Promise((resolve, reject) => {
          promise.then(resolve).catch(resolve);
        });
      }
    });

  //waits for all promises to resolve, then we send the components to be rendered down to the client side with all of their data hydrated in the redux store
  Promise.all(promises).then(() => {
    const context = {};
    //passess the req object to the renderer helper file, so it will be able to access the req.path property, order to tell what components need to be rendered on the server and sent back to the client side
    //The store is now full of data from the resolved promises that were initiated in the loadData funtion
    const content = renderer(req, store, context);
    if (context.url) {
      return res.redirect(301, context.url);
    }
    if (context.notFound) {
      res.status(404);
    }
    res.send(content);
  });
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});

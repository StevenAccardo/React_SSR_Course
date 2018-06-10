// startup point for the client side application

import 'babel-polyfill';
import React from 'react';
import { hydrate } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { renderRoutes } from 'react-router-config';
import axios from 'axios';
import Routes from './Routes';
import reducers from './reducers';

//custom axios instance that when use will prepend the '/api' route onto the route used in the method
// ex. axiosInstance.get('/users'); === /api/users
const axiosInstance = axios.create({
  baseURL: '/api'
});

//We instructed window.INITIAL_STATE to save the data from the server side store, and now it is being used as our initial state when the browser rerenders after the initial server side render
const store = createStore(reducers, window.INITIAL_STATE, applyMiddleware(thunk.withExtraArgument(axiosInstance)));

hydrate(
  <Provider store={store}>
    <BrowserRouter>
      <div>{renderRoutes(Routes)}</div>
    </BrowserRouter>
  </Provider>,
  document.querySelector('#root')
);

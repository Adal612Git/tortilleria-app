import './src/global.css';
import { registerRootComponent } from 'expo';

import App from './App';

// Web entry loads global styles before registering the app
registerRootComponent(App);

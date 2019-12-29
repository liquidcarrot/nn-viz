import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

// bootswatch & fonts
import "bootswatch/dist/lux/bootstrap.css";
import "typeface-roboto";
import "typeface-source-sans-pro";
import "typeface-montserrat";

// extensions
import VTooltip from 'v-tooltip'
Vue.use(VTooltip);

import TrendChart from "vue-trend-chart";
Vue.use(TrendChart);

import Toasted from 'vue-toasted';
Vue.use(Toasted)

new Vue({
  render: h => h(App),
}).$mount('#app')

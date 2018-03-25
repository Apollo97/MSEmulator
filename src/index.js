

import app from "./app.js";

app.start("#vue");

//https://github.com/glenjamin/webpack-hot-middleware/blob/master/example/client.js
if (module.hot) {
	module.hot.accept();
	module.hot.dispose(() => {
		window.location.reload();
	});
}

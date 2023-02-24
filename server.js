'use strict';

import Hapi from '@hapi/hapi'
import Inert from '@hapi/inert'
import HapiGapi from '@defra/hapi-gapi'

const initialiseHapiGapiPlugin = () => {
  const hapiGapiPropertySettings = []
	const ANALYTICS_PRIMARY_PROPERTY = false
	const ANALYTICS_XGOV_PROPERTY = "G-DJMSHRPMW8"
  if (ANALYTICS_PRIMARY_PROPERTY) {
    hapiGapiPropertySettings.push({ id: ANALYTICS_PRIMARY_PROPERTY, hitTypes: ['pageview', 'event', 'ecommerce'] })
  } else {
    console.warn("ANALYTICS_PRIMARY_PROPERTY not set, so Google Analytics won't track this")
  }
  if (ANALYTICS_XGOV_PROPERTY) {
    hapiGapiPropertySettings.push({ id: ANALYTICS_XGOV_PROPERTY, hitTypes: ['pageview'] })
  } else {
    console.warn("ANALYTICS_XGOV_PROPERTY not set, so Google Analytics won't track this")
  }

  return {
    plugin: HapiGapi,
    options: {
      propertySettings: hapiGapiPropertySettings,
      trackAnalytics: () => true,
      sessionIdProducer: async request => {
        let sessionId = null
        if (useSessionCookie(request)) {
          const { gaClientId } = await request.cache().helpers.status.get()
          sessionId = gaClientId ?? (await request.cache().getId())
        }
        return sessionId
      },
      attributionProducer: async request => {
        if (useSessionCookie(request)) {
          const { attribution } = await request.cache().helpers.status.get()

          if (attribution) {
            return {
              campaign: attribution[UTM.CAMPAIGN],
              content: attribution[UTM.CONTENT],
              medium: attribution[UTM.MEDIUM],
              source: attribution[UTM.SOURCE],
              term: attribution[UTM.TERM]
            }
          }
        }
        return {}
      }
    }
  }
}

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

		await server.register(Inert)
		await server.register(initialiseHapiGapiPlugin())
		
		

    server.route({
      method: 'GET',
      path: '/',
      handler: (request, h) => {
          return h.file('./public/index.html')
      }
  });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
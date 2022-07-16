var querystring = require("querystring");

/**
 * @param event {AWSCloudFrontFunction.Event}
 * @returns {AWSCloudFrontFunction.Response}
 */
function handler(event) {
  var host = event.request.headers["host"].value;

  if (process.env.HOST === host) {
    return event.request;
  }

  var location = "https://" + process.env.HOST + event.request.uri;

  if (
    event.request.querystring &&
    Object.keys(event.request.querystring).length
  ) {
    location += "?" + querystring.encode(event.request.querystring);
  }

  return {
    statusCode: 307,
    statusDescription: "Temporary Redirect",
    headers: {
      location: {
        value: location,
      },
    },
  };
}

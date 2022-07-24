#!/bin/sh
set -eo pipefail
# -e  Exit immediately if a command exits with a non-zero status.
# -o pipefail the return value of a pipeline is the status of the last command
#    to exit with a non-zero status, or zero if no command exited with a non-zero status

if [ -z "$DSN" ]; then
  export DSN="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  # export DSN="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?${DB_ARGS}"
fi

if [ -z "$COURIER_SMTP_CONNECTION_URI" ]; then
  # https://www.ory.sh/docs/guides/emails#aws-ses-smtp
  export COURIER_SMTP_CONNECTION_URI="smtp://${COURIER_SMTP_USER}:${COURIER_SMTP_PASSWORD}@${COURIER_SMTP_HOST}:587"
fi

exec "$@"
